import type { AdapterExport } from "../utils/adapter.ts";

import { checksumAddress } from "viem";

import {
  convertKeysToStartCase,
  convertValuesToNormal,
} from "../utils/object.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://app.ethena.fi/api/rewards?address={address}"
);

// { queryWallet: [{ accumulatedTotalShardsEarned: 11.55 }] };
export default {
  fetch: async (address: string) => {
    address = checksumAddress(address as `0x${string}`);

    const data = await (
      await fetch(API_URL.replace("{address}", address))
    ).json();

    return data.queryWallet[0];
  },
  data: (data: Record<string, number>) => {
    const Shards = data
      ? convertKeysToStartCase(convertValuesToNormal(data))
      : {};

    return { Shards };
  },
  total: (data: { accumulatedTotalShardsEarned?: number }) => ({
    Shards: data?.accumulatedTotalShardsEarned ?? 0,
  }),
} as AdapterExport;
