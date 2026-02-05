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

    if (res.status === 404) {
      return { data: [] };
    }

    if (!res.ok) {
      throw new Error(`Ethereal API error (${res.status}): ${res.statusText}`);
    }

    try {
      const json = await res.json();
      if (!json || !json.data || !Array.isArray(json.data)) {
        throw new Error("Invalid response from ethereal API: not an array");
      }
      return json;
    } catch (e) {
      throw new Error(`Failed to parse ethereal API response: ${e}`);
    }
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
    const data = apiData.data;

    if (!data || data.length === 0) {
      return { "S1 Points": 0, "S0 Points": 0 };
    }

    return {
      "S1 Points": Number(data[0]?.totalPoints),
      "S0 Points": Number(data[1]?.totalPoints),
    };
  },
  rank: (apiData: { data: API_RESPONSE[] }) => {
    const data = apiData.data;

    if (!data || data.length === 0) {
      return 0;
    }

    return data[0]?.rank;
  },
} as AdapterExport;