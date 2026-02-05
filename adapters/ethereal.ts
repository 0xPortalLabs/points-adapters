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

    const s1Data = data.find((item) => item.season === 1);
    const s0Data = data.find((item) => item.season === 0);

    return {
      "S1 Points": Number(s1Data?.totalPoints ?? 0) +
        Number(s1Data?.referralPoints ?? 0),
      "S0 Points": Number(s0Data?.totalPoints ?? 0) +
        Number(s0Data?.referralPoints ?? 0),
    };
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
