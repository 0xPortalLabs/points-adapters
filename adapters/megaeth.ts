import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const LEADERBOARD_URL = await maybeWrapCORSProxy(
  "https://terminal.megaeth.com/leaderboard"
);

const headers = {
  "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

type LeaderboardEntry = {
  rank: number;
  xAccount?: string;
  mainWalletAddress: string;
  totalPoints: number;
  weeklyPointsChange: number;
};

type LeaderboardEntries = {
  weekly: LeaderboardEntry[];
  all: LeaderboardEntry[];
};

type API_RESPONSE = {
  address: string;
  weekly?: LeaderboardEntry;
  allTime?: LeaderboardEntry;
};

const emptyResponse = (address: string): API_RESPONSE => ({
  address,
});

const parseLeaderboardEntries = (html: string): LeaderboardEntries => {
  const unescaped = html.replace(/\\"/g, '"').replace(/\\n/g, " ");
  const match = unescaped.match(
    /"entries":\{"weekly":(\[.*?\]),"all":(\[.*?\])\}/s
  );

  if (!match) {
    return { weekly: [], all: [] };
  }

  return JSON.parse(`{"weekly":${match[1]},"all":${match[2]}}`) as LeaderboardEntries;
};

const findEntry = (entries: LeaderboardEntry[], address: string) =>
  entries.find(
    (entry) => entry.mainWalletAddress.toLowerCase() === address.toLowerCase()
  );

export default {
  fetch: async (address) => {
    const res = await fetch(LEADERBOARD_URL, { headers });

    if (!res.ok) {
      return emptyResponse(address);
    }

    const entries = parseLeaderboardEntries(await res.text());

    return {
      address,
      weekly: findEntry(entries.weekly, address),
      allTime: findEntry(entries.all, address),
    };
  },
  data: (data: API_RESPONSE) => ({
    "Total Points": data.allTime?.totalPoints ?? data.weekly?.totalPoints ?? 0,
    Rank: data.allTime?.rank ?? 0,
    "Weekly Points": data.weekly?.weeklyPointsChange ?? 0,
    "Weekly Rank": data.weekly?.rank ?? 0,
  }),
  total: (data: API_RESPONSE) =>
    data.allTime?.totalPoints ?? data.weekly?.totalPoints ?? 0,
  rank: (data: API_RESPONSE) => data.allTime?.rank ?? 0,
  supportedAddressTypes: ["evm"],
} as AdapterExport;
