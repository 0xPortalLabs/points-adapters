import type { AdapterExport } from "../utils/adapter.ts";

import { titleCase } from "text-case";

const API_URL = "https://checkpoint.exchange/api/rewards/users/{address}";

const flattenObject = (obj: Record<string, any>, prefix: string) =>
  Object.fromEntries(
    Object.entries(obj ?? {}).map(([key, value]) => [
      `${prefix} - ${titleCase(key)}`,
      value ?? "",
    ])
  );

// 52ad0917ba55503961fd755329d9d8e9a7a4bde5
export default {
  fetch: async (address: string) => {
    const res = await fetch(API_URL.replace("{address}", address), {
      headers: {
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
    });
    return await res.json();
  },
  data: (data: Record<string, any>) => {
    if (!data) return {};

    const { pointsBreakdown, referral } = data;

    return {
      "First Deposited At": new Date(data.firstDepositAt * 1000).toISOString(),
      ...flattenObject(pointsBreakdown, "Breakdown"),
      ...flattenObject(referral, "Referral"),
    };
  },
  total: (data: Record<string, any>) => {
    return data ? Number(data.totalPoints) : 0;
  },
  rank: (data: Record<string, any>) => data.rank,
  supportedAddressTypes: ["evm"],
} as AdapterExport<Record<string, any>>;
