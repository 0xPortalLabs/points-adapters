import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://dashboard-apis.integralayer.com/api/v1/xp/{address}"
);

const headers = {
  "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
};

type API_RESPONSE = {
  wallet: string;
  xp: number;
  rank: number | null;
  breakdown: {
    staking_xp: number;
    social_xp: number;
    game_xp: number;
  };
  last_updated: string;
};

export default {
  fetch: async (address) => {
    const res = await fetch(
      API_URL.replace("{address}", address.toLowerCase()),
      { headers }
    );

    if (!res.ok) {
      throw new Error(`IntegraLayer XP API error: ${res.statusText}`);
    }

    return (await res.json()) as API_RESPONSE;
  },
  data: (data: API_RESPONSE) => ({
    XP: {
      "Total XP": data.xp,
      "Social XP": data.breakdown.social_xp,
      "Staking XP": data.breakdown.staking_xp,
      "Gaming XP": data.breakdown.game_xp,
      Rank: data.rank ?? 0,
    },
  }),
  total: (data: API_RESPONSE) => ({
    XP: data.xp,
  }),
  rank: (data: API_RESPONSE) => data.rank ?? 0,
  supportedAddressTypes: ["evm"],
} as AdapterExport;
