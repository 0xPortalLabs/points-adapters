import { titleCase } from "text-case";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://beta.api.blinq.fi/reward-service/api/rewards/points/{address}",
);

type BlinqPointsBreakdown = {
  point_type: string;
  total_rewards: string;
};

type BlinqPointsResponse = {
  block_checkpoint?: number;
  breakup?: BlinqPointsBreakdown[];
  total_rewards?: string;
  updated_at?: string;
  wallet_address?: string;
};

const getPoints = (data: BlinqPointsResponse): number =>
  Number(data.total_rewards ?? 0) || 0;

export default {
  fetch: async (address: string) => {
    const normalizedAddress = address.toLowerCase();
    const res = await fetch(API_URL.replace("{address}", normalizedAddress), {
      headers: {
        Accept: "application/json",
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
    });

    if (res.status === 404) {
      return {
        breakup: [],
        total_rewards: "0",
        wallet_address: normalizedAddress,
      } as BlinqPointsResponse;
    }

    if (!res.ok) {
      throw new Error(`Blinq points request failed with status ${res.status}`);
    }

    return await res.json() as BlinqPointsResponse;
  },
  data: (data: BlinqPointsResponse) => ({
    "Blinq Points": getPoints(data),
    ...Object.fromEntries(
      (data.breakup ?? []).map(({ point_type, total_rewards }) => [
        `${titleCase(point_type)} Points`,
        Number(total_rewards) || 0,
      ]),
    ),
    "Last Updated": data.updated_at ?? "N/A",
    "Block Checkpoint": data.block_checkpoint ?? "N/A",
  }),
  total: getPoints,
  supportedAddressTypes: ["evm"],
} as AdapterExport;
