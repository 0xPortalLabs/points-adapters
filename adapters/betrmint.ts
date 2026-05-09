import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://betrmint.fun/leaderboard/{address}"
);

type BetrmintData = {
  position: number;
  score: number | null;
  streak?: number;
  staker?: boolean;
  believer?: boolean;
};

export default {
  fetch: async (address: string) => {
    const res = await fetch(API_URL.replace("{address}", address.toLowerCase()), {
      headers: {
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
    });

    const data = await res.json();
    return data;
  },
  data: (data: BetrmintData) => ({
    Karma: {
      Points: data.score ?? 0,
      Position: data.position,
      Streak: data.streak ?? 0,
      Staker: data.staker ?? false,
      Believer: data.believer ?? false,
    },
  }),
  total: (data: BetrmintData) => ({
    Karma: data.score ?? 0,
  }),
  rank: (data: BetrmintData) => data.position || null,
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<BetrmintData>;
