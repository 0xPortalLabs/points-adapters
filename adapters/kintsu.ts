import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://www.kintsu.xyz/api/graphql",
);

const USER_POINTS_QUERY = `
  query UsersPoints($walletAddress: String!) {
    User_Points(where: { id: { _ilike: $walletAddress } }) {
      id
      totalPoints
      ranking
      percentile
    }
  }
`;

type KintsuPointsEntry = {
  id?: unknown;
  totalPoints?: unknown;
  ranking?: unknown;
  percentile?: unknown;
};

type KintsuResponse = {
  data?: {
    User_Points?: KintsuPointsEntry[];
  };
  errors?: Array<{ message?: string }>;
};

type KintsuPoints = {
  points: number;
  rank: number;
  percentile: number;
};

const emptyPoints = (): KintsuPoints => ({
  points: 0,
  rank: 0,
  percentile: 0,
});

const parseNumber = (
  value: unknown,
  field: string,
): number => {
  if (
    (typeof value !== "string" && typeof value !== "number") ||
    (typeof value === "string" && !value.trim())
  ) {
    throw new Error(`Kintsu response has no ${field}`);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Kintsu response has invalid ${field}`);
  }

  return parsed;
};

const parseEntry = (
  entry: KintsuPointsEntry,
  address: string,
): KintsuPoints => {
  if (
    typeof entry.id !== "string" ||
    entry.id.toLowerCase() !== address.toLowerCase()
  ) {
    throw new Error("Kintsu response returned a different wallet");
  }

  const rank = parseNumber(entry.ranking, "rank");
  if (!Number.isSafeInteger(rank)) {
    throw new Error("Kintsu response has invalid rank");
  }

  const percentile = parseNumber(entry.percentile, "percentile");
  if (percentile > 100) {
    throw new Error("Kintsu response has invalid percentile");
  }

  const points = parseNumber(entry.totalPoints, "points");
  if (!Number.isSafeInteger(points)) {
    throw new Error("Kintsu response has invalid points");
  }

  return {
    points,
    rank,
    percentile,
  };
};

export default {
  fetch: async (address: string) => {
    const normalizedAddress = getAddress(address);
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
      body: JSON.stringify({
        query: USER_POINTS_QUERY,
        variables: { walletAddress: normalizedAddress },
      }),
    });

    if (!res.ok) {
      throw new Error(`Kintsu request failed with status ${res.status}`);
    }

    const response = await res.json() as KintsuResponse;
    if (response.errors?.length) {
      throw new Error(
        `Kintsu request failed: ${
          response.errors[0]?.message ?? "unknown error"
        }`,
      );
    }

    const entries = response.data?.User_Points;
    if (!Array.isArray(entries)) {
      throw new Error("Kintsu response has no points data");
    }
    if (entries.length > 1) {
      throw new Error("Kintsu response returned multiple wallets");
    }

    const entry = entries[0];
    return entry ? parseEntry(entry, normalizedAddress) : emptyPoints();
  },
  data: ({ points, rank, percentile }: KintsuPoints) => ({
    "Kintsu Points": points,
    Rank: rank,
    Percentile: percentile,
  }),
  total: ({ points }: KintsuPoints) => points,
  rank: ({ rank }: KintsuPoints) => rank,
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<KintsuPoints>;
