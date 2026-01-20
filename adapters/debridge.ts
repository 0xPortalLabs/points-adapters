import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://points-api-td.debridge.finance/api/Points/{address}/summary",
);

const headers = {
  "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
};

/*
{
  "userRank": 3321,
  "totalPoints": 42142.9131768591251027500,
  "activeMultiplier": 1.5,
  "finalMultiplier": 1.5,
  "nft": null,
  "originMultiplier": null,
  "season": 1
}
  */
export default {
  fetch: async (address: string) => {
    const url = API_URL.replace("{address}", address);
    const [s1, s2, s3] = await Promise.all([
      fetch(url + "?season=1", { headers }),
      fetch(url + "?season=2", { headers }),
      fetch(url + "?season=3", { headers }),
    ]);

    return { s1: await s1.json(), s2: await s2.json(), s3: await s3.json() };
  },
  data: ({ s1, s2, s3 }: Record<string, Record<string, number | null>>) => {
    const get = (obj: Record<string, number | null>) => ({
      Rank: obj.userRank,
      "Total Points": obj.totalPoints,
      "Active Multiplier": obj.activeMultiplier,
      "Final Multiplier": obj.finalMultiplier,
      NFT: obj.nft,
      "Origin Multiplier": obj.originMultiplier,
    });

    return { "Season 1": get(s1), "Season 2": get(s2), "Season 3": get(s3) };
  },
  total: ({ s3 }: { s3: { totalPoints: number } }) => s3.totalPoints,
  rank: ({ s3 }: { s3: { userRank: number } }) => s3.userRank,
  claimable: ({ s2 }: { s2: { totalPoints: number } }) => s2.totalPoints > 0,
  deprecated: () => ({
    "Season 1": 1729113600, // Thursday 17th October 2024 08:00 UTC
    "Season 2": 1763554128, // Wednesday 19th November 2025 12:08 UTC
  }),
} as AdapterExport;
