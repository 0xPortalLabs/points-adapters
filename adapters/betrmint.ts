import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://betrmint.fun/leaderboard/{fid}"
);

type BetrmintData = {
  position: number;
  score: number;
};

export default {
  fetch: async (fid: number) => {
    const res = await fetch(API_URL.replace("{fid}", String(fid)), {
      headers: {
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
    });

    const data = await res.json();
    return data;
  },
  data: (data: BetrmintData) => ({
    Karma: {
      Points: data.score,
      Position: data.position,
    },
  }),
  total: (data: BetrmintData) => ({
    Karma: data.score,
  }),
  rank: (data: BetrmintData) => data.position,
  supportedAddressTypes: ["fid"],
} satisfies AdapterExport<BetrmintData>;
