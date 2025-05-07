import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://points-api-td.debridge.finance/api/Points/{address}/summary"
);

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
    const [s1, s2] = await Promise.all([
      (await fetch(url + "?season=1")).json(),
      (await fetch(url + "?season=2")).json(),
    ]);

    return { s1, s2 };
  },
  data: ({ s1, s2 }: Record<string, Record<string, number | null>>) => {
    const get = (obj: Record<string, number | null>) => ({
      Rank: obj.userRank,
      "Total Points": obj.totalPoints,
      "Active Multiplier": obj.activeMultiplier,
      "Final Multiplier": obj.finalMultiplier,
      NFT: obj.nft,
      "Origin Multiplier": obj.originMultiplier,
    });

    return { "Season 1": get(s1), "Season 2": get(s2) };
  },
  total: ({ s2 }: { s2: { totalPoints: number } }) => s2.totalPoints,
  rank: ({ s2 }: { s2: { userRank: number } }) => s2.userRank,
} as AdapterExport;
