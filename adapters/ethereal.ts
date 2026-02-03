import type { AdapterExport } from "../utils/adapter.ts";

import { checksumAddress } from "viem";
import { convertKeysToStartCase } from "../utils/object.ts";
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
    const headers = {
      "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
    };
    const res = await fetch(API_URL.replace("{address}", address));

    return (await res.json()).data;
  },
  data: (data: API_RESPONSE[]) => {
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
  total: (data: API_RESPONSE[]) => ({
    "S1 Points": Number(data[0]?.totalPoints),
    "S0 Points": Number(data[1]?.totalPoints),
  }),
  rank: (data: API_RESPONSE[]) => {
    return data[0]?.rank;
  },
} as AdapterExport;
