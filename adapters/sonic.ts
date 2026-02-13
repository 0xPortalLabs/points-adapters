import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://www.data-openblocklabs.com/sonic/user-points-stats?wallet_address={address}"
);

/**
 * {
  user_activity_last_detected: "2025-01-28T21:19:14.817735+00:00",
  wallet_address: "0xa571af45783cf0461aef7329ec7df3eea8c48a1e",
  sonic_points: 0.0,
  loyalty_multiplier: 0,
  ecosystem_points: 0.0,
  passive_liquidity_points: 0.0,
  activity_points: 0,
  rank: 0,
};
 */
export default {
  fetch: async (address: string) => {
    return await (
      await fetch(API_URL.replace("{address}", address), {
        headers: {
          "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
        },
      })
    ).json();
  },
  data: (data: Record<string, number>) => ({
    "User Activity Last Detected": new Date(
      data.user_activity_last_detected
    ).toString(),
    "Sonic Points": data.sonic_points,
    "Loyalty Multiplier": data.loyalty_multiplier,
    "Ecosystem Points": data.ecosystem_points,
    "Passive Liquidity Points": data.passive_liquidity_points,
    "Activity Points": data.activity_points,
    Rank: data.rank,
  }),
  total: (data: Record<string, number>) => data.sonic_points,
  rank: (data: { rank: number }) => data.rank,
  supportedAddressTypes: ["evm"],
} as AdapterExport;
