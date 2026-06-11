import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://leaderboard.incentiv.io/xp/{address}",
);

type IncentivXP = {
  total_xp?: number;
  rank?: number;
  season_tier?: string;
  last_updated?: string;
};

const emptyResponse = (): IncentivXP => ({
  total_xp: 0,
  rank: 0,
  season_tier: "N/A",
  last_updated: "N/A",
});

export default {
  fetch: async (address: string) => {
    const normalizedAddress = getAddress(address).toLowerCase();
    const res = await fetch(API_URL.replace("{address}", normalizedAddress), {
      headers: {
        Accept: "application/json",
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
    });

    if (res.status === 404) return emptyResponse();

    if (!res.ok) {
      throw new Error(`Incentiv XP request failed with status ${res.status}`);
    }

    return await res.json() as IncentivXP;
  },
  data: (data: IncentivXP) => ({
    XP: {
      Total: data.total_xp ?? 0,
      Rank: data.rank ?? 0,
      "Season Tier": data.season_tier ?? "N/A",
      "Last Updated": data.last_updated ?? "N/A",
    },
  }),
  total: (data: IncentivXP) => ({ XP: data.total_xp ?? 0 }),
  rank: (data: IncentivXP) => data.rank ?? 0,
  supportedAddressTypes: ["evm"],
} as AdapterExport;
