import type { AdapterExport } from "../utils/adapter.ts";
import { checksumAddress } from "viem";
import { convertKeysToStartCase } from "../utils/object.ts";

const API_URL = "https://api.ethereal.trade/v1/points/summary?address={address}";

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
    address = checksumAddress(address as `${0x${string}}`);
    const res = await fetch(API_URL.replace("{address}", address));

    return await res.json();
  },
  data: (apiData: { data: API_RESPONSE[] }) => {
    const data = apiData.data;

    if (!data || data.length === 0) {
      return {};
    }

    const info = data.reduce((acc, season) => {
      const {
        season: seasonNum,
        address,
        id,
        updatedAt,
        createdAt,
        ...rest
      } = season;
      const seasonObj = {
        ...rest,
        points: Number(season.totalPoints) + Number(season.referralPoints),
      };

      return {
        ...acc,
        ...convertKeysToStartCase(
          Object.fromEntries(
            Object.entries(seasonObj).map(([key, value]) => [
              `S${seasonNum}${key.charAt(0).toUpperCase() + key.slice(1)}`,
              value,
            ])
          )
        ),
      };
    }, {});
    return info;
  },
  total: (apiData: { data: API_RESPONSE[] }) => {
    const s1Data = data.find((item) => item.season === 1);
    const s0Data = data.find((item) => item.season === 0);

    return {
      "S1 Points": Number(s1Data?.totalPoints ?? 0),
      "S0 Points": Number(s0Data?.totalPoints ?? 0),
    };
  },
  rank: (apiData: { data: API_RESPONSE[] }) => {
    const s1Data = data.find((item) => item.season === 1);

    return s1Data?.rank ?? 0;
  },
} as AdapterExport;
