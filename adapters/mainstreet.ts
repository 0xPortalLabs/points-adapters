import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://api.mainstreet.finance/points/my-data?wallet={address}&season=3"
);

type API_RESPONSE = {
  success?: boolean;
  data?: {
    totalPoints?: number;
    claimedPoints?: number;
    season1Points?: number;
    season2Points?: number;
    season3Points?: number;
    season4Points?: number;
    rank?: number;
    season1Rank?: number;
    season2Rank?: number;
    season3Rank?: number;
    season4Rank?: number;
    updatedAt?: number;
  };
};

type SeasonData = {
  Points: number;
  Rank: number;
};

const getData = (response: API_RESPONSE) => response.data ?? {};

const getSeason = (
  response: API_RESPONSE,
  season: 1 | 2 | 3 | 4
): SeasonData => {
  const data = getData(response);

  return {
    Points: Number(data[`season${season}Points`] ?? 0),
    Rank: Number(data[`season${season}Rank`] ?? 0),
  };
};

export default {
  fetch: async (address: string) => {
    const res = await fetch(API_URL.replace("{address}", getAddress(address)), {
      headers: {
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
    });

    if (!res.ok) {
      throw new Error(`Mainstreet points request failed with status ${res.status}`);
    }

    return await res.json();
  },
  data: (response: API_RESPONSE) => {
    const data = getData(response);

    return {
      "Season 1": getSeason(response, 1),
      "Season 2": getSeason(response, 2),
      "Season 3": getSeason(response, 3),
      Totals: {
        "Active Season Points": Number(data.season3Points ?? 0),
        "All Seasons Points": Number(data.totalPoints ?? 0),
        "Claimed Points": Number(data.claimedPoints ?? 0),
      },
    };
  },
  total: (response: API_RESPONSE) => ({
    Gammas: Number(getData(response).season3Points ?? 0),
  }),
  rank: (response: API_RESPONSE) => Number(getData(response).season3Rank ?? 0),
  deprecated: () => ({
    "Season 1": 1762353092, // Wednesday 5th November 2025 14:31 UTC
    "Season 2": 1777334400, // Tuesday 28th April 2026 00:00 UTC
  }),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
