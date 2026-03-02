import type { AdapterExport } from "../utils/adapter.ts";

import { getAddress } from "viem";

import {
  convertKeysToStartCase,
  convertValuesToNormal,
} from "../utils/object.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://portal-api.plume.org/api/v1/stats/wallet?walletAddress={address}"
);

type PlumeStats = Record<string, string | number | null | undefined>;

export default {
  fetch: async (address: string) => {
    const res = await fetch(API_URL.replace("{address}", getAddress(address)), {
      headers: {
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
    });

    const data = await res.json();
    return (data?.data?.stats ?? {}) as PlumeStats;
  },
  data: (stats: PlumeStats) => {
    const filtered = Object.fromEntries(
      Object.entries(stats).filter(
        ([key, value]) =>
          key !== "walletAddress" &&
          (typeof value === "number" || typeof value === "string")
      )
    ) as Record<string, string | number>;

    return {
      "Plume Points": convertKeysToStartCase(convertValuesToNormal(filtered)),
    };
  },
  total: (stats: PlumeStats) => ({
    "Plume Points": Number(stats.totalXp ?? 0),
  }),
  rank: (stats: PlumeStats) => Number(stats.xpRank ?? 0),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
