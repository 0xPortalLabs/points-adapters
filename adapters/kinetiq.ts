import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

// Historical endpoint: https://kinetiq.xyz/api/points/{address}/history?chainId=1
const API_URL = await maybeWrapCORSProxy(
  "https://kinetiq.xyz/api/points/{address}?chainId=1"
);

// {
//   "address": "0x...",
//   "points": 1234.56,
//   "rank": 123,
//   "tier": "Gold"  // Bush, Bronze, Silver, Gold, Platinum, Diamond, Onyx
// }
export default {
  fetch: async (address: string) => {
    const url = API_URL.replace("{address}", address.toLowerCase());

    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    return await res.json();
  },
  data: (data: { rank?: number; tier: string }) => ({
    Tier: data.tier,
    Rank: data.rank,
  }),
  total: (data: { points: number }) => ({ kPoints: data.points }),
  rank: (data: { rank?: number }) => data.rank || 0,
  deprecated: () => ({
    points: 1760572800, // October 16th 2025 GMT
  }),
} as AdapterExport;
