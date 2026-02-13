import { getFidFromCustodyAddress } from "../utils/farcaster.ts";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";
import { getAddress } from "viem";

const API_URL = await maybeWrapCORSProxy(
  "https://rips.app/api/users/{fid}/stats"
);

export default {
  fetch: async (address) => {
    const fid = await getFidFromCustodyAddress(getAddress(address));
    const res_stats = await fetch(API_URL.replace("{fid}", fid), {
      headers: { "User-Agent": "Checkpoint API (https://checkpoint.exchange)" },
    });
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
  supportedAddressTypes: ["evm"],
} as AdapterExport;
