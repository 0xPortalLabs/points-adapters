import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://api.cap.app/v1/caps/account/{address}"
);

export default {
  fetch: async (address: string) => {
    const res = await fetch(API_URL.replace("{address}", address), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
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
