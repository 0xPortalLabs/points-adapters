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

    const season1 = s1Data
      ? {
        "S1 Total Points": Number(s1Data.totalPoints),
        "S1 Previous Total Points": Number(s1Data.previousTotalPoints),
        "S1 Referral Points": Number(s1Data.referralPoints),
        "S1 Previous Referral Points": Number(s1Data.previousReferralPoints),
        "S1 Rank": s1Data.rank,
        "S1 Previous Rank": s1Data.previousRank,
        "S1 Tier": s1Data.tier,
        "S1 Points": Number(s1Data.totalPoints) + Number(s1Data.referralPoints),
      }
      : {};

    const season0 = s0Data
      ? {
        "S0 Total Points": Number(s0Data.totalPoints),
        "S0 Previous Total Points": Number(s0Data.previousTotalPoints),
        "S0 Referral Points": Number(s0Data.referralPoints),
        "S0 Previous Referral Points": Number(s0Data.previousReferralPoints),
        "S0 Rank": s0Data.rank,
        "S0 Previous Rank": s0Data.previousRank,
        "S0 Tier": s0Data.tier,
        "S0 Points": Number(s0Data.totalPoints) + Number(s0Data.referralPoints),
      }
      : {};

    return { ...season1, ...season0 };
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
