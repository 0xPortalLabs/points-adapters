import type { AdapterExport } from "../utils/adapter.ts";
import { checksumAddress } from "viem";
import {
  convertKeysToStartCase,
  convertValuesToNormal,
} from "../utils/object.ts";

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
      ? convertKeysToStartCase(
        convertValuesToNormal({
          totalPoints: Number(s1Data.totalPoints),
          previousTotalPoints: Number(s1Data.previousTotalPoints),
          referralPoints: Number(s1Data.referralPoints),
          previousReferralPoints: Number(s1Data.previousReferralPoints),
          rank: s1Data.rank,
          previousRank: s1Data.previousRank,
          tier: s1Data.tier,
          points: Number(s1Data.totalPoints) + Number(s1Data.referralPoints),
        }),
      )
      : {};

    const season0 = s0Data
      ? convertKeysToStartCase(
        convertValuesToNormal({
          totalPoints: Number(s0Data.totalPoints),
          previousTotalPoints: Number(s0Data.previousTotalPoints),
          referralPoints: Number(s0Data.referralPoints),
          previousReferralPoints: Number(s0Data.previousReferralPoints),
          rank: s0Data.rank,
          previousRank: s0Data.previousRank,
          tier: s0Data.tier,
          points: Number(s0Data.totalPoints) + Number(s0Data.referralPoints),
        }),
      )
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
