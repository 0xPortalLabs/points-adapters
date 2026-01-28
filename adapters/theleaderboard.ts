import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

import { getFidFromCustodyAddress } from "../utils/farcaster.ts";
const API_URL = await maybeWrapCORSProxy(
  "https://mini.frm.lol/api/mini/leaderboard/rank/{fid}"
);

export default {
  fetch: async (address) => {
    const res = await fetch(
      API_URL.replace(
        "{fid}",
        await getFidFromCustodyAddress(getAddress(address))
      ),
      {
        headers: {
          "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
        },
      }
    );
    const data = await res.json();
    return data;
  },
  data: (data: {
    points: number;
    rank: number | string;
    farcasterUsername: string;
  }) => ({
    Points: data.points,
    Rank: data.rank === "1000+" ? 0 : data.rank,
    "Farcaster Username": data.farcasterUsername,
  }),
  total: (data: { points: number }) => data.points,
  rank: (data: { rank: number | string }) =>
    data.rank === "1000+" ? 0 : data.rank,
} as AdapterExport;
