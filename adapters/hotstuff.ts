import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy("https://api.hotstuff.trade/info");

const headers = {
  "Content-Type": "application/json",
  "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
};

type Epoch = {
  epoch: number;
  rank: number;
  points: number;
  own_points: number;
  referral_points: number;
  percentile: number;
};

type API_RESPONSE = {
  user: string;
  total_points: number;
  total_own_points: number;
  total_referral_points: number;
  net_rank: number;
  prev_net_rank: number;
  net_percentile: number;
  current_rank: number;
  epochs: Epoch[];
};

const postInfo = async (method: string, params: Record<string, string>) => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ method, params }),
  });

  if (!response.ok) {
    throw new Error(
      `Hotstuff points request failed with status ${response.status}`,
    );
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`Hotstuff points request failed: ${data.error}`);
  }

  return data;
};

export default {
  fetch: async (address: string): Promise<API_RESPONSE> => {
    return await postInfo("pointsHistory", {
      user: getAddress(address).toLowerCase(),
    });
  },
  data: (data: API_RESPONSE) => {
    const epochs = Object.fromEntries(
      data.epochs.map((epoch) => [
        `Epoch ${epoch.epoch}`,
        epoch.points,
      ]),
    );

    return {
      Points: {
        "Total Points": data.total_points,
        "Own Points": data.total_own_points,
        "Referral Points": data.total_referral_points,
        "Net Rank": data.net_rank,
        "Previous Net Rank": data.prev_net_rank,
        "Net Percentile": data.net_percentile,
        "Current Rank": data.current_rank,
        ...epochs,
      },
    };
  },
  total: (data: API_RESPONSE) => data.total_points,
  rank: (data: API_RESPONSE) => data.net_rank,
  supportedAddressTypes: ["evm"],
} as AdapterExport;
