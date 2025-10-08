import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

// Kinetiq kPoints API
// Website: https://kinetiq.xyz/kpoints
// Documentation: https://kinetiq.xyz/docs/kpoints
//
// API endpoint discovered by inspecting https://kinetiq.xyz/_next/static/chunks/app/(defi)/kpoints/page-*.js
// Supports multiple chains: chainId=1 (Ethereum), chainId=8453 (Base)
const API_URL = await maybeWrapCORSProxy(
  "https://kinetiq.xyz/api/points/{address}?chainId=1"
);

// API Response structure:
// {
//   "address": "0x...",
//   "points": 1234.56,
//   "rank": 123,
//   "tier": "Gold"  // Bush, Bronze, Silver, Gold, Platinum, Diamond, Onyx
// }

export default {
  fetch: async (address: string) => {
    // Normalize address to lowercase
    const normalizedAddress = address.toLowerCase();
    const url = API_URL.replace("{address}", normalizedAddress);

    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  },
  data: (data: {
    address: string;
    points: number;
    rank?: number;
    tier: string;
  }) => ({
    "kPoints": data.points,
    "League": data.tier,
    "Rank": data.rank || 0,
  }),
  total: (data: { points: number }) => data.points,
  rank: (data: { rank?: number }) => data.rank || 0,
} as AdapterExport;
