import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";

// Public wallet lookup; direct browser requests work without a CORS proxy.
const API_URL = "https://api.montramarkets.xyz/api/airdrop/wallets/";

type MontraSeason = { season: number; points: number; rank: number };
type MontraData = { current: MontraSeason; past: MontraSeason[] };

const parseSeason = (response: unknown): MontraSeason => {
  if (!response || typeof response !== "object" || Array.isArray(response)) {
    throw new Error("Montra response has invalid points data");
  }
  const data = response as Record<string, unknown>;
  if (
    typeof data.season !== "number" || !Number.isSafeInteger(data.season) ||
    data.season < 1
  ) {
    throw new Error("Montra response has invalid season");
  }
  if (typeof data.points !== "string" || !/^\d+$/.test(data.points)) {
    throw new Error("Montra response has invalid points");
  }
  // The app displays points as whole units, not 18-decimal token amounts.
  // Each season's total already includes trading, launching, and levels.
  // Ignore top10.weeks: its MONTRA allocation estimates are not points.
  const points = Number(data.points);
  if (!Number.isSafeInteger(points)) {
    throw new Error("Montra response has invalid points");
  }
  // Unknown wallets return explicit zero points and null rank. Never turn
  // missing fields, request failures, or invalid responses into zero balances.
  const rank = data.rank === null && points === 0 ? 0 : data.rank;
  if (
    typeof rank !== "number" || !Number.isSafeInteger(rank) ||
    rank < (points > 0 ? 1 : 0)
  ) {
    throw new Error("Montra response has invalid rank");
  }
  return { season: data.season, points, rank };
};

const seasonLabel = (season: MontraSeason) =>
  `Season ${season.season} Montra Points`;

export default {
  fetch: async (address: string): Promise<MontraData> => {
    const wallet = getAddress(address).toLowerCase();
    let res: Response;
    try {
      res = await fetch(API_URL + wallet, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10000),
      });
    } catch (error) {
      throw new Error(
        "Montra points request failed before receiving a response",
        { cause: error },
      );
    }
    if (!res.ok) {
      throw new Error(`Montra points request failed with status ${res.status}`);
    }

    const response: unknown = await res.json().catch((error: unknown) => {
      throw new Error("Failed to read or parse Montra points response", {
        cause: error,
      });
    });
    const current = parseSeason(response);
    const data = response as Record<string, unknown>;
    if (!Array.isArray(data.past)) {
      throw new Error("Montra response has invalid past seasons");
    }
    const past = data.past.map(parseSeason);
    if (
      past.some((season) => season.season >= current.season) ||
      new Set(past.map((season) => season.season)).size !== past.length
    ) {
      throw new Error("Montra response has invalid past seasons");
    }
    return { current, past };
  },
  data: (data: MontraData) =>
    Object.fromEntries(
      [data.current, ...data.past].map((season) => [
        seasonLabel(season),
        { Total: season.points, Rank: season.rank },
      ]),
    ),
  total: (data: MontraData) =>
    Object.fromEntries(
      [data.current, ...data.past].map((season) => [
        seasonLabel(season),
        season.points,
      ]),
    ),
  rank: (data: MontraData) => data.current.rank,
  // Season 1 ended at MONTRA's launch on November 10, 2026, 00:36 UTC.
  // https://montramarkets.xyz/airdrop
  deprecated: () => ({ "Season 1 Montra Points": 1794270960 }),
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<MontraData>;
