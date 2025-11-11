import { getAddress } from "viem";
import { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://app.nansen.ai/api/points-leaderboard",
);

// 0x6E93Ebc8302890fF1D1BeFd779D1DB131eF30D4d - Testing address
export default {
  fetch: async (address: string) => {
    const res = await fetch(API_URL);
    const data = await res.json();
    return data.filter(
      (obj: { evm_address: string }) => obj.evm_address === getAddress(address),
    )[0];
  },
  data: (data: {
    points: number;
    rank: number;
    tier: string;
    is_eligible: boolean;
  }) => {
    if (!data) return {};
    return {
      points: data.points,
      rank: data.rank,
      tier: data.tier,
      is_eligible: String(data.is_eligible),
    };
  },
  total: (data: { points: number }) => {
    if (!data) return 0;
    return data.points;
  },
  rank: (data: { rank: number }) => {
    if (!data) return 0;
    return data.rank;
  },
} as AdapterExport;
