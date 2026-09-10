import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://8vcuob4bv8.execute-api.us-east-2.amazonaws.com/leaderboard_v2",
);

type FortytwoEntry = {
  original?: unknown;
  total_reward?: unknown;
  rank?: unknown;
};

const getNumber = (
  entry: FortytwoEntry | undefined,
  field: "total_reward" | "rank",
): number => {
  if (!entry) return 0;

  const value = entry[field];
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`Fortytwo response has invalid ${field}`);
  }
  if (field === "rank" && (!Number.isInteger(value) || value === 0)) {
    throw new Error("Fortytwo response has invalid rank");
  }

  return value;
};

export default {
  fetch: async (address: string) => {
    const normalizedAddress = getAddress(address).toLowerCase();
    const params = new URLSearchParams({
      period: "all_time",
      page: "1",
      size: "1",
      wallet_filter: normalizedAddress,
    });
    const res = await fetch(`${API_URL}?${params}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
    });

    if (!res.ok) {
      throw new Error(`Fortytwo request failed with status ${res.status}`);
    }

    const response = await res.json() as { results?: unknown };
    if (!Array.isArray(response.results)) {
      throw new Error("Fortytwo response has no leaderboard results");
    }

    const entry = response.results[0];
    if (entry === undefined) return undefined;
    if (!entry || typeof entry !== "object") {
      throw new Error("Fortytwo response has an invalid leaderboard entry");
    }

    const fortytwoEntry = entry as FortytwoEntry;
    if (
      typeof fortytwoEntry.original !== "string" ||
      fortytwoEntry.original.toLowerCase() !== normalizedAddress
    ) {
      throw new Error("Fortytwo response returned a different wallet");
    }

    return fortytwoEntry;
  },
  data: (entry: FortytwoEntry | undefined) => ({
    "FOR Points": getNumber(entry, "total_reward"),
    Rank: getNumber(entry, "rank"),
  }),
  total: (entry: FortytwoEntry | undefined) => getNumber(entry, "total_reward"),
  rank: (entry: FortytwoEntry | undefined) => getNumber(entry, "rank"),
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<FortytwoEntry | undefined>;
