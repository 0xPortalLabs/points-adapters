import type { AdapterExport } from "../utils/adapter.ts";

// Legacy Ethereal points deprecated in Checkpoint on November 9, 2026.
// The exact campaign end date could not be verified. Use 2026-11-09 00:00 UTC
// as the date we recorded deprecation, not a confirmed points-accrual cutoff.
// Meridian is a separate deployment; this does not deprecate Meridian rewards:
// https://docs.meridian.xyz/developer-guides/trading-api/migrate-from-ethereal
// The legacy points endpoint returned HTTP 503 for both test wallets on review.
// Keep this adapter network-free. Zero totals are retired placeholders, not
// verified historical wallet balances.
export default {
  fetch: () => Promise.resolve({}),
  data: () => ({ "S0 Points": {}, "S1 Points": {} }),
  total: () => ({ "S0 Points": 0, "S1 Points": 0 }),
  rank: () => 0,
  claimable: () => false,
  deprecated: () => ({
    "S0 Points": 1794182400,
    "S1 Points": 1794182400,
  }),
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport;

/*
ARCHIVED IMPLEMENTATION — DISABLED, NOT EXECUTABLE
Retained for reference. Verify the points program, API, and browser access before
restoring. Replace the retired export above; do not just swap in Meridian hosts.

import type { AdapterExport } from "../utils/adapter.ts";
import { checksumAddress } from "viem";

const API_URL =
  "https://api.ethereal.trade/v1/points/summary?address={address}";

type API_RESPONSE = {
  id: string;
  address: string;
  season: number;
  totalPoints: string;
  previousTotalPoints: string;
  referralPoints: string;
  previousReferralPoints: string;
  rank: number;
  previousRank: number;
  tier: number;
  createdAt: number;
  updatedAt: number;
};

export default {
  fetch: async (address: string) => {
    address = checksumAddress(address as `0x${string}`);
    const res = await fetch(API_URL.replace("{address}", address), {
      headers: {
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
    });

    return await res.json();
  },
  data: (apiData: { data: API_RESPONSE[] }) => {
    const data = apiData.data;

    if (!data || !Array.isArray(data)) {
      return {};
    }

    const groups: Record<string, Record<string, number>> = {};

    // Dynamically load fields from API response
    data.forEach((item) => {
      const seasonKey = `S${item.season} Points`;

      // Dynamically create keys from the API fields
      groups[seasonKey] = {
        "Total Points": Number(item.totalPoints),
        "Previous Total Points": Number(item.previousTotalPoints),
        "Referral Points": Number(item.referralPoints),
        "Previous Referral Points": Number(item.previousReferralPoints),
        Rank: item.rank,
        "Previous Rank": item.previousRank,
        Tier: item.tier,
        Points: Number(item.totalPoints) + Number(item.referralPoints),
      };
    });

    return groups;
  },
  total: (apiData: { data: API_RESPONSE[] }) => {
    const data = apiData.data;

    if (!data || !Array.isArray(data)) {
      return {};
    }

    // Dynamically calculate totals
    const totals: Record<string, number> = {};

    data.forEach((item) => {
      const seasonKey = `S${item.season} Points`;
      totals[seasonKey] =
        Number(item.totalPoints) + Number(item.referralPoints);
    });

    return totals;
  },
  rank: (apiData: { data: API_RESPONSE[] }) => {
    const data = apiData.data;

    if (!data || !Array.isArray(data)) {
      return 0;
    }

    // Use S1 (current) rank by default
    return data.find((item) => item.season === 1)?.rank ?? 0;
  },
  supportedAddressTypes: ["evm"],
} as AdapterExport;
*/
