import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://eth-api.infinifi.xyz/api/points/v3/user/{address}",
);

type InfiniFiData = {
  v1Points: number;
  v2Points: number;
  v3Points: number;
  finalizedPoints: number;
  pendingPoints: number;
  referralPoints: number;
  rank: number;
  lastUpdateTimestampSec: number;
};

const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("infiniFi returned invalid points data");
  }
  return value as Record<string, unknown>;
};

const nonNegativeNumber = (value: unknown, field: string): number => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`infiniFi returned invalid ${field}`);
  }
  return value;
};

export default {
  fetch: async (address: string): Promise<InfiniFiData> => {
    const wallet = getAddress(address);
    const res = await fetch(API_URL.replace("{address}", wallet), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      throw new Error(
        `infiniFi points request failed with status ${res.status}`,
      );
    }
    const response = record(await res.json());
    if (response.code !== "OK") {
      throw new Error("infiniFi points request returned an API error");
    }
    const data = record(response.data);
    if (!Array.isArray(data.v3Points)) {
      throw new Error("infiniFi returned invalid V3 points");
    }
    let finalizedPoints = 0;
    let pendingPoints = 0;
    let referralPoints = 0;
    for (const entry of data.v3Points) {
      const chapter = record(entry);
      const points = nonNegativeNumber(chapter.points, "chapter points");
      const referrals = nonNegativeNumber(
        chapter.referralPoints ?? 0,
        "chapter referral points",
      );
      if (typeof chapter.isFinalized !== "boolean") {
        throw new Error("infiniFi returned invalid chapter status");
      }
      // Include pending chapters and each chapter's referrals once. The
      // top-level finalized/referral totals and source details are subtotals.
      if (chapter.isFinalized) finalizedPoints += points + referrals;
      else pendingPoints += points + referrals;
      referralPoints += referrals;
    }
    const rank = nonNegativeNumber(data.rank, "rank");
    const lastUpdateTimestampSec = nonNegativeNumber(
      data.lastUpdateTimestampSec,
      "last update timestamp",
    );
    if (
      !Number.isSafeInteger(rank) ||
      !Number.isFinite(new Date(lastUpdateTimestampSec * 1000).getTime())
    ) {
      throw new Error(
        "infiniFi returned invalid rank or last update timestamp",
      );
    }
    return {
      v1Points: nonNegativeNumber(data.v1Points, "V1 points"),
      v2Points: nonNegativeNumber(data.v2Points, "V2 points"),
      v3Points: nonNegativeNumber(finalizedPoints + pendingPoints, "V3 points"),
      finalizedPoints,
      pendingPoints,
      referralPoints,
      rank,
      lastUpdateTimestampSec,
    };
  },
  data: (data: InfiniFiData) => ({
    "V3 Points": {
      Total: data.v3Points,
      "Finalized Points": data.finalizedPoints,
      "Pending Points": data.pendingPoints,
      "Referral Points (Included)": data.referralPoints,
      Rank: data.rank,
      "Last Updated Time": new Date(data.lastUpdateTimestampSec * 1000)
        .toISOString(),
    },
    "V2 Points": { Total: data.v2Points },
    "V1 Points": { Total: data.v1Points },
  }),
  total: (data: InfiniFiData) => ({
    "V3 Points": data.v3Points,
    "V2 Points": data.v2Points,
    "V1 Points": data.v1Points,
  }),
  rank: (data: InfiniFiData) => data.rank,
  deprecated: () => ({
    "V1 Points": 1764547200, // December 1st 2025
  }),
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<InfiniFiData>;
