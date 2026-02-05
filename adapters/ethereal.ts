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
} as AdapterExport;
