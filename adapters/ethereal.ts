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
    address = checksumAddress(address);
    const res = await fetch(API_URL.replace("{address}", address), {
      headers: {
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
    });

    return await res.json();
  },
  data: (apiData: { data: API_RESPONSE[] }) => {
    const data = apiData.data;

    if (!data || data.length === 0) {
      return {};
    }

    // Dynamically create keys based on available seasons (non-brittle)
    const groups: Record<string, Record<string, number>> = {};

    for (const item of data) {
      const seasonKey = `S${item.season} Points`;
      groups[seasonKey] = {
        "Total Points": Number(item.totalPoints),
        "Previous Total Points": Number(item.previousTotalPoints),
        "Referral Points": Number(item.referralPoints),
        "Previous Referral Points": Number(item.previousReferralPoints),
        "Rank": item.rank,
        "Previous Rank": item.previousRank,
        "Tier": item.tier,
        "Points": Number(item.totalPoints) + Number(item.referralPoints),
      };
    }

    return groups;
  },
  total: (apiData: { data: API_RESPONSE[] }) => {
    const data = apiData.data;

    if (!data || data.length === 0) {
      return {};
    }

    // Dynamically calculate total points for each season (matches data() structure)
    const totals: Record<string, number> = {};

    for (const item of data) {
      const seasonKey = `S${item.season} Points`;
      totals[seasonKey] = Number(item.totalPoints) +
        Number(item.referralPoints);
    }

    return totals;
  },
  rank: (apiData: { data: API_RESPONSE[] }) => {
    const data = apiData.data;

    if (!data || data.length === 0) {
      return 0;
    }

    // Use S1 (current) rank by default
    return data.find((item) => item.season === 1)?.rank ?? 0;
  },
} as AdapterExport;
