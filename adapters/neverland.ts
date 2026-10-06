import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { wrapCORSProxy } from "../utils/cors.ts";

// TRACKING ONLY — DO NOT USE FOR A CHECKPOINT MARKET.
// Pearls reset each roughly monthly Tide and weight a random reward draw;
// they are not a persistent balance or a guaranteed redeemable allocation.
// Discover the current Tide, then query the wallet. Keep Tide-specific labels
// so tracking consumers do not compare balances across different Tides.
// This is a policy note, not an enforced market-disable flag in AdapterExport.
const API_URL = "https://app.neverland.money/api";

type NeverlandData = { pearls: number; rankDisplay: string; epoch: number };

const getObject = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Neverland response has invalid points data");
  }
  return value as Record<string, unknown>;
};

const request = async (
  path: string,
  signal: AbortSignal,
): Promise<Record<string, unknown>> => {
  const url = API_URL + path;
  // Neverland blocks Checkpoint's browser origin. Keep backend calls direct.
  const requestUrl = "document" in globalThis ? wrapCORSProxy(url) : url;
  let res: Response;
  try {
    res = await fetch(requestUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal,
    });
  } catch (error) {
    throw new Error(
      "Neverland Pearls request failed before receiving a response",
      { cause: error },
    );
  }
  if (!res.ok) {
    throw new Error(
      `Neverland Pearls request failed with status ${res.status}`,
    );
  }
  return getObject(
    await res.json().catch((error: unknown) => {
      throw new Error("Failed to read or parse Neverland Pearls response", {
        cause: error,
      });
    }),
  );
};

export default {
  fetch: async (address: string): Promise<NeverlandData> => {
    const wallet = getAddress(address).toLowerCase();
    // One shared deadline bounds both sequential requests and their body reads.
    const signal = AbortSignal.timeout(10000);
    const current = await request("/epoch", signal);
    if (
      !Array.isArray(current.LeaderboardState) ||
      current.LeaderboardState.length !== 1
    ) {
      throw new Error("Neverland response has invalid Tide metadata");
    }
    const state = getObject(current.LeaderboardState[0]);
    const epoch = state.currentEpochNumber;
    if (
      typeof epoch !== "number" || !Number.isSafeInteger(epoch) || epoch < 1
    ) {
      throw new Error("Neverland response has invalid Tide number");
    }
    if (state.isActive !== true) {
      throw new Error(
        "Neverland has no active Tide; cannot query current Pearls",
      );
    }
    const params = new URLSearchParams({
      address: wallet,
      epoch: String(epoch),
    });
    const response = await request(`/user?${params}`, signal);
    const rows = response.UserEpochStats;
    if (!Array.isArray(rows) || rows.length > 1) {
      throw new Error("Neverland response has invalid wallet epoch results");
    }
    // Verified unknown wallets return an empty array, not an HTTP error.
    if (rows.length === 0) return { pearls: 0, rankDisplay: "Unranked", epoch };

    const stats = getObject(rows[0]);
    // Match the app's boosted total and fallback, already including bonuses.
    // The API returns numeric fixed-point values with 18 decimals, not strings.
    // Never use UserLeaderboardState.lifetimePoints or sum component balances.
    const raw = stats.totalPointsWithMultiplier ?? stats.totalPoints;
    if (typeof raw !== "number" || !Number.isFinite(raw) || raw < 0) {
      throw new Error("Neverland response has invalid Pearls");
    }
    const pearls = raw / 1e18;
    if (pearls > Number.MAX_SAFE_INTEGER) {
      throw new Error("Neverland response has invalid Pearls");
    }
    // Non-top ranks can be approximate. Preserve the app's display label
    // instead of publishing approxRank (or the row's placeholder rank) as exact.
    const rankDisplay = getObject(response.rankDisplay).display;
    if (typeof rankDisplay !== "string" || !rankDisplay.trim()) {
      throw new Error("Neverland response has invalid rank display");
    }
    return { pearls, rankDisplay, epoch };
  },
  data: (data: NeverlandData) => ({
    [`Tide ${data.epoch} Pearls`]: {
      Total: data.pearls,
      Rank: data.rankDisplay,
    },
  }),
  total: (data: NeverlandData) => ({
    [`Tide ${data.epoch} Pearls`]: data.pearls,
  }),
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<NeverlandData>;
