import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";

import { maybeWrapCORSProxy } from "../utils/cors.ts";
import { convertKeysToStartCase } from "../utils/object.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://api.reya.xyz/api/incentives/wallet/{address}"
);
// 0xefcbfd73d67f92b37713e7eb9284e813b8f0e49a
type API_RESPONSE = {
  points: {
    total: {
      totalPoints: number;
      tradingPoints: number;
      stakingPoints: number;
      signalPoints: number;
      rank: number;
    };
  };
  boosts: {
    tradingBoost: number;
    stakingBoost: number;
    loyaltyBoost: number;
  };
};
export default {
  fetch: async (address: string) => {
    const res = await fetch(API_URL.replace("{address}", getAddress(address)));
    return await res.json();
  },
  data: (data: API_RESPONSE) => ({
    ...convertKeysToStartCase({
      ...data.points.total,
      ...data.boosts,
    }),
  }),
  total: (data: API_RESPONSE) => data.points.total.totalPoints,
  rank: (data: API_RESPONSE) => data.points.total.rank,
} as AdapterExport;
