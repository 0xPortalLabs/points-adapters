import type { AdapterExport } from "../utils/adapter.ts";

import { checksumAddress } from "viem";

import {
  convertKeysToStartCase,
  convertValuesToNormal,
} from "../utils/object.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://app.ethena.fi/api/referral/get-referree?address={address}",
);

// { queryWallet: [{ accumulatedTotalShardsEarned: 11.55 }] };
export default {
  fetch: async (address: string) => {
    address = checksumAddress(address as `0x${string}`);

    const res = await fetch(API_URL.replace("{address}", address), {
      headers: {
          "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
    });

    const data = await res.json();

    return data.queryWallet[0];
  },
  data: (data: Record<string, number | string | null>) => {
    if (!data) return {};

    const filtered: Record<string, number | string> = {};

    for (const key in data) {
      const value = data[key];
      if (value == null) continue;
      if (typeof value === "object") continue;
      filtered[key] = value;
    }

    return convertKeysToStartCase(convertValuesToNormal(filtered));
  },
  total: (data: { accumulatedTotalShardsEarned?: number }) => ({
    Shards: data?.accumulatedTotalShardsEarned ?? 0,
  }),
  claimable: (data: { accumulatedTotalShardsEarned?: number }) =>
    (data?.accumulatedTotalShardsEarned ?? 0) > 0,
} as AdapterExport;
