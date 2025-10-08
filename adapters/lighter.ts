import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

// Lighter.xyz Points API
// Website: https://lighter.xyz/
// Documentation: https://apidocs.lighter.xyz/
// 
// NOTE: Lighter.xyz does not have a publicly documented HTTP REST API for points.
// Their API primarily uses WebSocket (wss://mainnet.zklighter.elliot.ai/stream)
// This adapter uses a placeholder structure that should be updated once a REST endpoint is available.
//
// To find the actual endpoint: inspect network requests on https://lighter.xyz or
// contact Lighter support for API documentation.
const API_URL = await maybeWrapCORSProxy(
  "https://mainnet.zklighter.elliot.ai/api/v1/rewards/{address}"
);

// Expected API response structure:
// {
//   "address": "0x...",
//   "total_points": 1234.56,
//   "referral_points": 789.12,
//   "trading_points": 445.44,
//   "rank": 123
// }

export default {
  fetch: async (address: string) => {
    // Normalize address to lowercase for consistency
    const normalizedAddress = address.toLowerCase();
    const url = API_URL.replace("{address}", normalizedAddress);

    try {
      const response = await fetch(url, {
        headers: {
          "Accept": "application/json",
        },
      });

      // Handle 404 - user might not have an account or points
      if (response.status === 404) {
        return {
          address: normalizedAddress,
          total_points: 0,
          referral_points: 0,
          trading_points: 0,
          rank: 0,
        };
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        address: normalizedAddress,
        total_points: data.total_points || data.points || 0,
        referral_points: data.referral_points || 0,
        trading_points: data.trading_points || 0,
        rank: data.rank || 0,
      };
    } catch (error) {
      console.warn(`Lighter adapter: ${error}`);
      // Return empty data structure on error to prevent adapter failure
      return {
        address: normalizedAddress,
        total_points: 0,
        referral_points: 0,
        trading_points: 0,
        rank: 0,
      };
    }
  },
  data: (data: {
    total_points: number;
    referral_points: number;
    trading_points: number;
  }) => ({
    "Total Points": data.total_points,
    "Referral Points": data.referral_points,
    "Trading Points": data.trading_points,
  }),
  total: (data: { total_points: number }) => data.total_points,
  rank: (data: { rank: number }) => data.rank,
} as AdapterExport;