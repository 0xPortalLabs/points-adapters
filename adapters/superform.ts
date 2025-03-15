import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://www.superform.xyz/api/proxy/superrewards/exploration/leaderboard/cred/{address}"
);

/**
{
  $schema: "https://api.superform.xyz/schemas/UserCredLeaderboard.json",
  current_user: {
    cred: 57932.9261003624,
    rank: 15253,
    tier: "Bronze",
    percent_complete: 28.28,
  },
  cred_tiers: [
    { tier: "Ethereal", cred: 869766757.6176672, rank: 1, is_user: false },
    { tier: "Mythic", cred: 289283729.8177169, rank: 10, is_user: false },
    { tier: "Diamond", cred: 54370643.94241665, rank: 50, is_user: false },
    { tier: "Onyx", cred: 11002000.936844787, rank: 250, is_user: false },
    { tier: "Gold", cred: 1493962.0512288355, rank: 1250, is_user: false },
    { tier: "Silver", cred: 204824.36505193752, rank: 6250, is_user: false },
    { tier: "Bronze", cred: 57932.9261003624, rank: 15253, is_user: true },
  ],
};
 */
export default {
  fetch: async (address: string) => {
    return (await (await fetch(API_URL.replace("{address}", address))).json())
      .current_user;
  },
  data: (data: Record<string, string | number>) => ({ Cred: data }),
  total: (data: { cred: number }) => ({ Cred: data.cred }),
  rank: (data: { rank: number }) => data.rank,
} as AdapterExport;
