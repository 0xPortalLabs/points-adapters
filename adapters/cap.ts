import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://api.cap.app/v1/caps/account/{address}"
);

export default {
  fetch: async (address: string) => {
    const res = await fetch(API_URL.replace("{address}", address), {
      headers: {
          "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
    });
    return await res.json();
  },
  data: (data: { rank: number; caps: string }) => {
    if (!data) return {};
    return { Caps: data.caps, rank: data.rank };
  },
  total: (data: { caps: string }) => {
    const points = data ? Number(data.caps) : 0;
    return { Caps: points };
  },
  rank: (data: { rank: number }) => data.rank,
} as AdapterExport;
