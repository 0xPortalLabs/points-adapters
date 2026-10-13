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
    // The API accepts this UA, but rejects "Checkpoint API (...)".
    const res = await fetch(
      API_URL.replace("{address}", address.toLowerCase()),
      {
        headers: {
          "User-Agent": "CheckpointAPI/1.0 (+https://checkpoint.exchange)",
        },
      }
    );
    if (!res.ok) {
      throw new Error(`Betrmint API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return data;
  },
  data: (data: BetrmintData) => ({
    Karma: {
      Points: data.score ?? 0,
      Position: data.position,
      Streak: data.streak ?? 0,
      Staker: data.staker ? "Yes" : "No",
      Believer: data.believer ? "Yes" : "No",
    },
  }),
  total: (data: BetrmintData) => ({
    Karma: data.score ?? 0,
  }),
  rank: (data: BetrmintData) => (data.position > 0 ? data.position : 0),
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<BetrmintData>;
