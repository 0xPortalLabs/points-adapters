import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://incentives.fairground.fi/api/v1/user_scores",
);

type LeaderboardEntry = {
  owner?: string;
  rank?: number;
  updated_at?: string;
  earned_xp?: number;
  epoch_number?: number;
  fees_score?: number;
  participation_score?: number;
  pnl_score?: number;
  rebate_score?: number;
  season_id?: number;
  total_bonus_score?: number;
  total_score?: number;
  previous_total_score?: number;
};

type LeaderboardResponse = {
  data?: LeaderboardEntry[];
};

const emptyEntry = (): LeaderboardEntry => ({
  rank: 0,
  earned_xp: 0,
  epoch_number: 0,
  fees_score: 0,
  participation_score: 0,
  pnl_score: 0,
  rebate_score: 0,
  season_id: 0,
  total_bonus_score: 0,
  total_score: 0,
  previous_total_score: 0,
});

const getSeasonXP = (entry: LeaderboardEntry): number =>
  Number(entry.total_score ?? 0);

export default {
  fetch: async (address: string) => {
    const normalizedAddress = address.toLowerCase();
    const params = new URLSearchParams({
      page: "1",
      page_size: "1",
      "filters[0][field]": "owner",
      "filters[0][op]": "ilike_and",
      "filters[0][value]": normalizedAddress,
    });

    const res = await fetch(`${API_URL}?${params}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
    });

    if (!res.ok) {
      throw new Error(
        `Fairground leaderboard request failed with status ${res.status}`,
      );
    }

    const response = await res.json() as LeaderboardResponse;
    return response.data?.find(
      (entry) => entry.owner?.toLowerCase() === normalizedAddress,
    ) ?? emptyEntry();
  },
  data: (entry: LeaderboardEntry) => ({
    "Season XP": {
      Total: getSeasonXP(entry),
      Rank: Number(entry.rank ?? 0),
      "Season ID": Number(entry.season_id ?? 0),
      "Latest Scored Epoch": Number(entry.epoch_number ?? 0),
      "Latest Epoch XP": Number(entry.earned_xp ?? 0),
      "Previous Total": Number(entry.previous_total_score ?? 0),
      "Fees XP": Number(entry.fees_score ?? 0),
      "Participation XP": Number(entry.participation_score ?? 0),
      "PnL XP": Number(entry.pnl_score ?? 0),
      "Rebate XP": Number(entry.rebate_score ?? 0),
      "Bonus XP": Number(entry.total_bonus_score ?? 0),
      "Last Updated": entry.updated_at ?? "N/A",
    },
  }),
  total: (entry: LeaderboardEntry) => ({
    "Season XP": getSeasonXP(entry),
  }),
  rank: (entry: LeaderboardEntry) => Number(entry.rank ?? 0),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
