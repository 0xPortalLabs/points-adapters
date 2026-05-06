import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_BASE_URL = await maybeWrapCORSProxy("https://api.fuul.xyz/api/v1");

const POINTS_BEARER =
  "db09744e57bb1884bbe7c9fe47a779117c39b655f43eb478fabe2277f7f1b5c6";

const headers = {
  accept: "application/json",
  authorization: `Bearer ${POINTS_BEARER}`,
  "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
};

type LeaderboardEntry = {
  total_amount?: number | string;
  rank?: number;
  total_attributions?: number;
};

type Movement = {
  date: string;
  conversion_name: string;
  total_amount: string;
  payout_status: string;
};

type LeaderboardResponse = {
  results?: LeaderboardEntry[];
  total_results?: number;
  calculated_at?: string;
};

type MovementsResponse = {
  results?: Movement[];
  total_results?: number;
};

type API_RESPONSE = {
  leaderboard: LeaderboardEntry;
  leaderboardTotal: number;
  calculatedAt?: string;
  movements: Movement[];
};

const emptyLeaderboard = (): LeaderboardEntry => ({
  total_amount: 0,
  rank: 0,
  total_attributions: 0,
});

const toNumber = (value: number | string | undefined): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  return Number(value) || 0;
};

const formatMovementLabel = (movement: Movement): string => {
  const date = new Date(movement.date);
  const dateLabel = Number.isNaN(date.getTime())
    ? movement.date
    : date.toISOString().slice(0, 10);

  return `${dateLabel} - ${movement.conversion_name}`;
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

const fetchMovements = async (address: string): Promise<Movement[]> => {
  const pageSize = 100;
  const results: Movement[] = [];
  let totalResults = 0;

  for (let page = 1; page <= 100; page += 1) {
    const movementParams = new URLSearchParams({
      user_identifier: address,
      identifier_type: "evm_address",
      type: "point",
      page_size: String(pageSize),
      page: String(page),
    });
    const response = await fetchJson<MovementsResponse>(
      `/payouts/movements?${movementParams}`
    );
    const pageResults = response.results ?? [];

    results.push(...pageResults);
    totalResults = Math.max(totalResults, Number(response.total_results ?? 0));

    if (pageResults.length === 0 || results.length >= totalResults) {
      break;
    }
  }

  return results;
};

const getMovementsTotal = (movements: Movement[]): number =>
  movements.reduce((total, movement) => total + toNumber(movement.total_amount), 0);

export default {
  fetch: async (address: string) => {
    const normalizedAddress = getAddress(address).toLowerCase();
    const params = new URLSearchParams({ user_identifier: normalizedAddress });

    const [leaderboard, movements] = await Promise.all([
      fetchJson<LeaderboardResponse>(`/payouts/leaderboard/points?${params}`),
      fetchMovements(normalizedAddress),
    ]);

    return {
      leaderboard: leaderboard.results?.[0] ?? emptyLeaderboard(),
      leaderboardTotal: Number(leaderboard.total_results ?? 0),
      calculatedAt: leaderboard.calculated_at,
      movements,
    };
  },
  data: (response: API_RESPONSE) => {
    const totalPoints = getMovementsTotal(response.movements);
    const breakdown = Object.fromEntries(
      response.movements.map((movement) => [
        formatMovementLabel(movement),
        {
          Points: toNumber(movement.total_amount),
          Status: movement.payout_status,
        },
      ])
    );

    return {
      Summary: {
        Points: totalPoints,
        Rank: Number(response.leaderboard.rank ?? 0),
        "Total Attributions": Number(response.leaderboard.total_attributions ?? 0),
        "Movement Count": response.movements.length,
      },
      ...breakdown,
    };
  },
  total: (response: API_RESPONSE) => getMovementsTotal(response.movements),
  rank: (response: API_RESPONSE) => Number(response.leaderboard.rank ?? 0),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
