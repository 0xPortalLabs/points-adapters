import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";

const API_URL = "https://api.fuul.xyz/api/v1/payouts/leaderboard/points";
const API_KEY =
  "91995247f2c1716808d98e7b65d3d55468dc271ba9a8e62d4ce4a8c0b327ab84";

type LeaderboardEntry = {
  address?: unknown;
  total_amount?: unknown;
  rank?: unknown;
};

const getNumber = (
  entry: LeaderboardEntry | undefined,
  field: "total_amount" | "rank",
): number => {
  if (!entry) return 0;

  const value = entry[field];
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    (typeof value === "string" && !value.trim())
  ) {
    throw new Error(`Coinshift response has no ${field}`);
  }

  const parsed = Number(value);
  if (
    !Number.isFinite(parsed) ||
    parsed < 0 ||
    (field === "rank" && (!Number.isInteger(parsed) || parsed === 0))
  ) {
    throw new Error(`Coinshift response has invalid ${field}`);
  }

  return parsed;
};

export default {
  fetch: async (address: string) => {
    const normalizedAddress = getAddress(address).toLowerCase();
    const res = await fetch(
      `${API_URL}?user_identifier=${normalizedAddress}&user_identifier_type=evm_address&page=1&page_size=1`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${API_KEY}`,
          "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
        },
      },
    );

    if (!res.ok) {
      throw new Error(`Coinshift request failed with status ${res.status}`);
    }

    const response = await res.json() as { results?: unknown };
    if (!Array.isArray(response.results)) {
      throw new Error("Coinshift response has no leaderboard results");
    }

    const entry = response.results[0];
    if (entry === undefined) return undefined;
    if (!entry || typeof entry !== "object") {
      throw new Error("Coinshift response has an invalid leaderboard entry");
    }

    const leaderboardEntry = entry as LeaderboardEntry;
    if (
      typeof leaderboardEntry.address !== "string" ||
      leaderboardEntry.address.toLowerCase() !== normalizedAddress
    ) {
      throw new Error("Coinshift response returned a different wallet");
    }

    return leaderboardEntry;
  },
  data: (entry: LeaderboardEntry | undefined) => ({
    "Season 2 Points": getNumber(entry, "total_amount"),
    Rank: getNumber(entry, "rank"),
  }),
  total: (entry: LeaderboardEntry | undefined) =>
    getNumber(entry, "total_amount"),
  rank: (entry: LeaderboardEntry | undefined) => getNumber(entry, "rank"),
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<LeaderboardEntry | undefined>;
