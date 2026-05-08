import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://app.altura.trade/api/leaderboard/search?address={address}&epoch={epoch}"
);

const ACTIVE_EPOCH = 4;

type LeaderboardEntry = {
  user_address?: string;
  points?: number;
  quest_points?: number;
  rank?: number;
  error?: string;
};

type API_RESPONSE = {
  season4: LeaderboardEntry;
};

const emptyEntry = (address: string): LeaderboardEntry => ({
  user_address: address,
  points: 0,
  quest_points: 0,
  rank: 0,
});

const getSeason = (entry: LeaderboardEntry): Record<string, number> => {
  return {
    Peaks: Number(entry.points ?? 0),
    "Quest Points": Number(entry.quest_points ?? 0),
    Rank: Number(entry.rank ?? 0),
  };
};

const fetchEpoch = async (
  address: string,
  epoch: number
): Promise<LeaderboardEntry> => {
  const res = await fetch(
    API_URL.replace("{address}", address).replace("{epoch}", String(epoch)),
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
    }
  );

  if (res.status === 404) {
    return emptyEntry(address);
  }

  if (!res.ok) {
    throw new Error(`Altura leaderboard request failed with status ${res.status}`);
  }

  const data = await res.json() as LeaderboardEntry & {
    twitterusername?: string | null;
    twitterpfp?: string | null;
  };

  return {
    user_address: data.user_address,
    points: data.points,
    quest_points: data.quest_points,
    rank: data.rank,
  };
};

export default {
  fetch: async (address: string) => {
    const normalizedAddress = getAddress(address).toLowerCase();
    return {
      season4: await fetchEpoch(normalizedAddress, ACTIVE_EPOCH),
    };
  },
  data: (response: API_RESPONSE) => {
    return {
      "Season 1": getSeason(emptyEntry(response.season4.user_address ?? "")),
      "Season 2": getSeason(emptyEntry(response.season4.user_address ?? "")),
      "Season 3": getSeason(emptyEntry(response.season4.user_address ?? "")),
      "Season 4": getSeason(response.season4),
    };
  },
  total: (response: API_RESPONSE) => ({
    "Season 4": Number(response.season4.points ?? 0),
  }),
  rank: (response: API_RESPONSE) => Number(response.season4.rank ?? 0),
  deprecated: () => ({
    "Season 1": 1771545600, // Friday 20th February 2026 00:00 UTC
    "Season 2": 1775174400, // Friday 3rd April 2026 00:00 UTC
    "Season 3": 1777766400, // Sunday 3rd May 2026 00:00 UTC
  }),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
