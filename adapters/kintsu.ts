import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://www.kintsu.xyz/api/graphql",
);

const USER_POINTS_QUERY = `
  query UsersPoints($walletAddress: String!) {
    User_Points(where: { id: { _ilike: $walletAddress } }) {
      totalPoints
      ranking
      percentile
    }
  }
`;

type KintsuPointsEntry = {
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

const getValue = (
  data: KintsuResponse,
  field: keyof KintsuPointsEntry,
): number => {
  const account = data.data?.User_Points?.[0];
  if (!account) return 0;

  const value = account[field];
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

    return response;
  },
  data: (data: KintsuResponse) => ({
    "Kintsu Points": getValue(data, "totalPoints"),
    Rank: getValue(data, "ranking"),
    Percentile: getValue(data, "percentile"),
  }),
  total: (data: KintsuResponse) => getValue(data, "totalPoints"),
  rank: (data: KintsuResponse) => getValue(data, "ranking"),
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<KintsuResponse>;
