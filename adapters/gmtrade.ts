import { formatUnits } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";

const API_URL =
  "https://gmx-solana-sqd.squids.live/gmx-solana-base:prod/api/graphql";
const GT_DECIMALS = 7;

const USER_GT_QUERY = `
  query GetUserGtInfo($userAddress: String!) {
    userGtInfos(where: { id_eq: $userAddress }) {
      id
      gt
      gtRank
    }
  }
`;

type GMTradeEntry = {
  id?: unknown;
  gt?: unknown;
  gtRank?: unknown;
};

type GMTradeResponse = {
  data?: { userGtInfos?: unknown };
  errors?: Array<{ message?: string }>;
};

const getPoints = (entry: GMTradeEntry | undefined): number => {
  if (!entry) return 0;
  if (typeof entry.gt !== "string" || !/^\d+$/.test(entry.gt)) {
    throw new Error("GMTrade response has invalid GT holdings");
  }

  const points = Number(formatUnits(BigInt(entry.gt), GT_DECIMALS));
  if (!Number.isFinite(points) || points < 0) {
    throw new Error("GMTrade response has invalid GT holdings");
  }

  return points;
};

const getRank = (entry: GMTradeEntry | undefined): number => {
  if (!entry) return 0;

  if (
    (typeof entry.gtRank !== "string" && typeof entry.gtRank !== "number") ||
    (typeof entry.gtRank === "string" && !entry.gtRank.trim())
  ) {
    throw new Error("GMTrade response has invalid rank");
  }

  const rank = Number(entry.gtRank);
  if (!Number.isInteger(rank) || rank <= 0) {
    throw new Error("GMTrade response has invalid rank");
  }

  return rank;
};

export default {
  fetch: async (address: string) => {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
      body: JSON.stringify({
        query: USER_GT_QUERY,
        variables: { userAddress: address },
      }),
    });

    if (!res.ok) {
      throw new Error(`GMTrade request failed with status ${res.status}`);
    }

    const response = await res.json() as GMTradeResponse;
    if (response.errors?.length) {
      throw new Error(
        `GMTrade request failed: ${
          response.errors[0]?.message ?? "unknown error"
        }`,
      );
    }

    const entries = response.data?.userGtInfos;
    if (!Array.isArray(entries)) {
      throw new Error("GMTrade response has no points data");
    }
    if (!entries.length) return undefined;

    const rawEntry = entries[0];
    if (!rawEntry || typeof rawEntry !== "object") {
      throw new Error("GMTrade response has invalid points data");
    }

    const entry = rawEntry as GMTradeEntry;
    if (entry.id !== address) {
      throw new Error("GMTrade response returned a different wallet");
    }

    return entry;
  },
  data: (entry: GMTradeEntry | undefined) => ({
    "GT Holdings": getPoints(entry),
  }),
  total: getPoints,
  rank: getRank,
  supportedAddressTypes: ["svm"],
} satisfies AdapterExport<GMTradeEntry | undefined>;
