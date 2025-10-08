import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

// Extended Exchange Points API
// Website: https://app.extended.exchange/points
// Documentation: https://docs.extended.exchange/extended-resources/points
//
// Note: The exact API endpoint needs to be verified by inspecting network requests
// on https://app.extended.exchange/points or through official API documentation.
// This adapter uses a likely endpoint structure based on common patterns.
const API_URL = await maybeWrapCORSProxy(
  "https://app.extended.exchange/api/points/{address}"
);

// Expected response structure based on Extended's Points Program:
// Points are distributed across: Trading, Liquidity Providing, and Referrals
// {
//   "address": "0x...",
//   "total_points": 12345.67,
//   "trading_points": 5000.00,
//   "liquidity_points": 4000.00,
//   "referral_points": 3345.67,
//   "rank": 123
// }

export default {
  fetch: async (address: string) => {
    // Normalize address to lowercase
    const normalizedAddress = address.toLowerCase();
    const url = API_URL.replace("{address}", normalizedAddress);

    try {
      const response = await fetch(url, {
        headers: {
          "Accept": "application/json",
        },
      });

      // Handle 404 - user might not have points yet
      if (response.status === 404) {
        return {
          address: normalizedAddress,
          total_points: 0,
          trading_points: 0,
          liquidity_points: 0,
          referral_points: 0,
          rank: 0,
        };
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        address: normalizedAddress,
        total_points: data.total_points || data.totalPoints || 0,
        trading_points: data.trading_points || data.tradingPoints || 0,
        liquidity_points: data.liquidity_points || data.liquidityPoints || 0,
        referral_points: data.referral_points || data.referralPoints || 0,
        rank: data.rank || 0,
      };
    } catch (error) {
      console.warn(`Extended adapter: ${error}`);
      // Return zero points on error to prevent adapter failure
      return {
        address: normalizedAddress,
        total_points: 0,
        trading_points: 0,
        liquidity_points: 0,
        referral_points: 0,
        rank: 0,
      };
    }
  },
  data: (data: {
    total_points: number;
    trading_points: number;
    liquidity_points: number;
    referral_points: number;
  }) => ({
    "Total Points": data.total_points,
    "Trading Points": data.trading_points,
    "Liquidity Points": data.liquidity_points,
    "Referral Points": data.referral_points,
  }),
  total: (data: { total_points: number }) => data.total_points,
  rank: (data: { rank: number }) => data.rank,
} as AdapterExport;
