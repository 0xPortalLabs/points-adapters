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
interface DeBridgeResponse {
  userRank: number;
  totalPoints: number;
  activeMultiplier: number;
  finalMultiplier: number;
  nft: number | null;
  originMultiplier: number | null;
  season: number;
}

export default {
  fetch: async (address: string) => {
    const url = API_URL.replace("{address}", address);
    const [s1, s2] = await Promise.all([
      (await fetch(url + "?season=1")).json(),
      (await fetch(url + "?season=2")).json(),
    ]);
    return { s1, s2 };
  },
  data: ({ s1, s2 }: { s1: DeBridgeResponse; s2: DeBridgeResponse }) => ({
    "Season 1": {
      "Total Points": s1.totalPoints || 0,
      "Active Multiplier": s1.activeMultiplier || 1,
      "Final Multiplier": s1.finalMultiplier || 1,
      "NFT Multiplier": s1.nft || 0,
      "Origin Multiplier": s1.originMultiplier || 0,
      Rank: s1.userRank || 0,
    },
    "Season 2": {
      "Total Points": s2.totalPoints || 0,
      "Active Multiplier": s2.activeMultiplier || 1,
      "Final Multiplier": s2.finalMultiplier || 1,
      "NFT Multiplier": s2.nft || 0,
      "Origin Multiplier": s2.originMultiplier || 0,
      Rank: s2.userRank || 0,
    }
  }),
  total: ({ s1, s2 }: { s1: DeBridgeResponse; s2: DeBridgeResponse }) => ({
    "Season 1": s1.totalPoints || 0,
    "Season 2": s2.totalPoints || 0
  }),
  rank: ({ s2 }: { s2: DeBridgeResponse }) => s2.userRank || 0,
} as AdapterExport;