import { getFidFromCustodyAddress } from "../utils/farcaster.ts";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";
import { getAddress } from "viem";
import { convertKeysToStartCase } from "../utils/object.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://rips.app/api/users/{fid}/stats"
);

type DATA_TYPE = {
  stats: Record<string, number>;
};

export default {
  fetch: async (address) => {
    const fid = await getFidFromCustodyAddress(getAddress(address));
    const res_stats = await fetch(API_URL.replace("{fid}", fid));
    const data = await res_stats.json();
    return data.stats;
  },
  data: (stats: Record<string, number>) => ({
    Rips: {
      Streak: stats.streak,
      Points: stats.totalRips,
    },
  }),
  total: (stats: Record<string, number>) => ({
    Rips: stats.totalRips,
  }),
} as AdapterExport;
