import type { AdapterExport } from "../utils/adapter.ts";
import { formatEther } from "viem";

const API_URL = "https://metadata.p.rainbow.me/v1/graph";

type API_RESPONSE = {
  earnings: { total: number };
  meta: { rewards: { total: string } };
};

const DEFAULT_RESPONSE: API_RESPONSE = {
  earnings: { total: 0 },
  meta: { rewards: { total: "0" } },
};

export default {
  fetch: async (address: string) => {
    const res = await fetch(API_URL, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer cYTvNiT7WQaQXCXVsbBn7H9cyxboFCQ3",
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
      method: "POST",
      body: JSON.stringify({
        query: `query getPointsDataForWallet($address: String!) {
    claimablePoints(address: $address) {
      error { message type }
      meta { rewards { total } }
      user {
        earnings { total }
      }
    }
  }`,
        variables: { address },
      }),
    });
    const data = await res.json();
    const points = data.data?.claimablePoints;
    if (!points) return DEFAULT_RESPONSE;

    return { ...points.user, meta: points.meta };
  },
  data: (data: API_RESPONSE) => {
    const points = data.earnings.total;
    const rewards = data.meta.rewards.total || "0";

    return {
      Points: points,
      Claimable: rewards !== "0" ? "Yes" : "No",
      Rewards: `${formatEther(BigInt(rewards))} ETH`,
    };
  },
  total: (data: API_RESPONSE) => Number(data.earnings.total),
  claimable: (data: API_RESPONSE) => (data.meta.rewards.total || "0") !== "0",
  // Preserve historical balances. Use the verified feature-removal date;
  // the exact points-earning cutoff has not been confirmed.
  // https://github.com/rainbow-me/rainbow/commit/2582937e97ec10b95c393b3b48da82c99a0f5abf
  deprecated: () => ({ Points: 1772496000 }), // March 3rd 2026 00:00 UTC
  supportedAddressTypes: ["evm"],
} as AdapterExport;
