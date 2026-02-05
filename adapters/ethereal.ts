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
    const res = await fetch(API_URL.replace("{address}", address));

    return await res.json();
  },
  data: (apiData: { data: API_RESPONSE[] }) => {
    const data = apiData.data;

    if (!data || data.length === 0) {
      return {};
    }

    const s1Data = data.find((item) => item.season === 1);
    const s0Data = data.find((item) => item.season === 0);

    const groups: Record<string, Record<string, number>> = {
      "S1 Points": {},
      "S0 Points": {},
    };

    const parse = (season: number, category: string, value: number) => {
      const seasonKey = season === 1 ? "S1 Points" : "S0 Points";
      if (groups[seasonKey]) {
        groups[seasonKey][category] = value;
      }
    };

    if (s1Data) {
      parse(1, "Total Points", Number(s1Data.totalPoints));
      parse(1, "Previous Total Points", Number(s1Data.previousTotalPoints));
      parse(1, "Referral Points", Number(s1Data.referralPoints));
      parse(
        1,
        "Previous Referral Points",
        Number(s1Data.previousReferralPoints),
      );
      parse(1, "Rank", s1Data.rank);
      parse(1, "Previous Rank", s1Data.previousRank);
      parse(1, "Tier", s1Data.tier);
    }

    if (s0Data) {
      parse(0, "Total Points", Number(s0Data.totalPoints));
      parse(0, "Previous Total Points", Number(s0Data.previousTotalPoints));
      parse(0, "Referral Points", Number(s0Data.referralPoints));
      parse(
        0,
        "Previous Referral Points",
        Number(s0Data.previousReferralPoints),
      );
      parse(0, "Rank", s0Data.rank);
      parse(0, "Previous Rank", s0Data.previousRank);
      parse(0, "Tier", s0Data.tier);
    }

    return groups;
  },
  total: (apiData: { data: API_RESPONSE[] }) => {
    const s1Data = apiData.data.find((item) => item.season === 1);
    const s0Data = apiData.data.find((item) => item.season === 0);

    return {
      "S1 Points": Number(s1Data?.totalPoints ?? 0),
      "S0 Points": Number(s0Data?.totalPoints ?? 0),
    };
  },
  rank: (apiData: { data: API_RESPONSE[] }) => {
    const s1Data = apiData.data.find((item) => item.season === 1);

    return s1Data?.rank ?? 0;
  },
} as AdapterExport;
