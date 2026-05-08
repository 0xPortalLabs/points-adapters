import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_BASE_URL = await maybeWrapCORSProxy("https://api.fuul.xyz/api/v1");

const SEASONS = [
  {
    key: "Hypear Season 1 Points",
    bearer: "474dbca7dd9bbea87574955416713c5436b295369b65d6bded6d682b9a60ca7d",
    deprecatedAt: Date.UTC(2025, 9, 22) / 1000,
  },
  {
    key: "Hypear Season 2 Points",
    bearer: "9bcf04c003c32f6a2dc660e4ba1b6830c21d260ed6b856418d3b2a302cde41b9",
    deprecatedAt: Date.UTC(2026, 2, 26) / 1000,
  },
  {
    key: "Hypear Season 3 Points",
    bearer: "ee672fb6b16ec804803dd3b8078e28e7da140127a00c166dbc8e391cf258accb",
    deprecatedAt: undefined,
  },
] as const;

type SeasonKey = (typeof SEASONS)[number]["key"];

type LeaderboardEntry = {
  address?: string;
  user_identifier?: string;
  user_identifier_type?: string;
  total_amount?: number | string;
  affiliate_name?: string | null;
  rank?: number;
  total_attributions?: number;
};

type LeaderboardResponse = {
  results?: LeaderboardEntry[];
  total_results?: number;
  calculated_at?: string;
};

type SeasonResponse = {
  leaderboard: LeaderboardEntry;
  leaderboardTotal: number;
  calculatedAt?: string;
};

type API_RESPONSE = Record<SeasonKey, SeasonResponse>;

const emptyLeaderboard = (): LeaderboardEntry => ({
  total_amount: 0,
  rank: 0,
  total_attributions: 0,
});

const headersFor = (bearer: string) => ({
  accept: "application/json",
  authorization: `Bearer ${bearer}`,
  "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
});

const toNumber = (value: number | string | undefined): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  return Number(value) || 0;
};

const fetchJson = async <T>(path: string, bearer: string): Promise<T> => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: headersFor(bearer),
  });

  if (res.status === 404) {
    return { results: [], total_results: 0 } as T;
  }

  if (!res.ok) {
    throw new Error(`Pear request failed with status ${res.status}`);
  }

  return await res.json() as T;
};

const fetchSeason = async (
  address: string,
  bearer: string
): Promise<SeasonResponse> => {
  const params = new URLSearchParams({
    user_identifier: address,
    user_identifier_type: "evm_address",
  });

  const leaderboard = await fetchJson<LeaderboardResponse>(
    `/payouts/leaderboard/points?${params}`,
    bearer
  );

  return {
    leaderboard: leaderboard.results?.[0] ?? emptyLeaderboard(),
    leaderboardTotal: Number(leaderboard.total_results ?? 0),
    calculatedAt: leaderboard.calculated_at,
  };
};

const getSeasonTotal = (season: SeasonResponse): number =>
  toNumber(season.leaderboard.total_amount);

const getLatestSeason = (response: API_RESPONSE): SeasonResponse => {
  for (const season of [...SEASONS].reverse()) {
    const seasonResponse = response[season.key];
    if (getSeasonTotal(seasonResponse) > 0) {
      return seasonResponse;
    }
  }
  return response["Hypear Season 3 Points"];
};

const buildSeasonBreakdown = (season: SeasonResponse) => ({
  "Total Points": getSeasonTotal(season),
  Rank: Number(season.leaderboard.rank ?? 0),
  "Total Attributions": Number(season.leaderboard.total_attributions ?? 0),
});

export default {
  fetch: async (address: string) => {
    const normalizedAddress = getAddress(address).toLowerCase();
    const entries = await Promise.all(
      SEASONS.map(async (season) => [
        season.key,
        await fetchSeason(normalizedAddress, season.bearer),
      ])
    );

    return Object.fromEntries(entries) as API_RESPONSE;
  },
  data: (response: API_RESPONSE) =>
    Object.fromEntries(
      SEASONS.map((season) => [
        season.key,
        buildSeasonBreakdown(response[season.key]),
      ])
    ),
  total: (response: API_RESPONSE) =>
    Object.fromEntries(
      SEASONS.map((season) => [
        season.key,
        getSeasonTotal(response[season.key]),
      ])
    ),
  rank: (response: API_RESPONSE) =>
    Number(getLatestSeason(response).leaderboard.rank ?? 0),
  deprecated: () =>
    Object.fromEntries(
      SEASONS.flatMap((season) =>
        season.deprecatedAt ? [[season.key, season.deprecatedAt]] : []
      )
    ),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
