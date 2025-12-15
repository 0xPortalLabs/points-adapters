import { fidFromAddress } from "../utils/farcaster.ts";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";
import { getAddress } from "viem";
import { convertKeysToStartCase } from "../utils/object.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://rips.app/api/users/{fid}/stats",
);

type DATA_TYPE = {
  stats: Record<string, number>;
};

export default {
  fetch: async (address) => {
    const fid = await fidFromAddress(getAddress(address));
    const res_stats = await fetch(API_URL.replace("{fid}", String(fid)));
    const data = await res_stats.json();
    return {
      stats: data.stats,
    };
  },
  data: (data: DATA_TYPE) => {
    return convertKeysToStartCase(data.stats);
  },
  total: (data: DATA_TYPE) => ({
    "Total Rips": data.stats.totalRips,
  }),
} as AdapterExport;
