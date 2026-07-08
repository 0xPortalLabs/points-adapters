import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_BASE_URL = await maybeWrapCORSProxy(
  "https://analytics-v3.valantis-analytics.xyz",
);

const POINTS_BEARER = "f2ffd7876ec03f1f4a04ed88402b1802";

const headers = {
  accept: "application/json",
  authorization: `Bearer ${POINTS_BEARER}`,
  "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
};

type LeaderboardEntry = {
  total_amount?: number | string;
  total?: number;
  rank?: number;
  total_attributions?: number;
};

type LeaderboardResponse = {
  results?: LeaderboardEntry[];
  total_results?: number;
  calculated_at?: string;
};

type API_RESPONSE = {
  leaderboard: LeaderboardEntry;
  leaderboardTotal: number;
  calculatedAt?: string;
};

const emptyLeaderboard = (): LeaderboardEntry => ({
  total_amount: 0,
  total: 0,
  rank: 0,
  total_attributions: 0,
});

const toNumber = (value: number | string | undefined): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  return Number(value) || 0;
};

const fetchJson = async <T>(path: string): Promise<T> => {
  const res = await fetch(`${API_BASE_URL}${path}`, { headers });

  if (res.status === 404) {
    return { results: [], total_results: 0 } as T;
  }

  if (!res.ok) {
    throw new Error(`Valantis request failed with status ${res.status}`);
  }

  return await res.json() as T;
};

const getLeaderboardTotal = (response: API_RESPONSE): number =>
  toNumber(response.leaderboard.total_amount);

export default {
  fetch: async (address: string) => {
    const normalizedAddress = getAddress(address).toLowerCase();
    const params = new URLSearchParams({ user_identifier: normalizedAddress });

    const leaderboard = await fetchJson<LeaderboardResponse>(
      `/api/v1/payouts/leaderboard/points?${params}`,
    );

    return {
      leaderboard: leaderboard.results?.[0] ?? emptyLeaderboard(),
      leaderboardTotal: Number(leaderboard.total_results ?? 0),
      calculatedAt: leaderboard.calculated_at,
    };
  },
  data: (response: API_RESPONSE) => ({
    Points: getLeaderboardTotal(response),
    Rank: Number(response.leaderboard.rank ?? 0),
    "Leaderboard Total": response.leaderboardTotal,
  }),
  total: (response: API_RESPONSE) => getLeaderboardTotal(response),
  rank: (response: API_RESPONSE) => Number(response.leaderboard.rank ?? 0),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
