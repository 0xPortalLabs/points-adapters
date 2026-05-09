import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://mini.frm.lol/api/mini/leaderboard/rank/{fid}"
);

type LeaderboardData = {
  points: number;
  rank: number | string;
  farcasterUsername: string;
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
  data: (data: LeaderboardData) => ({
    Points: data.points,
    Rank: data.rank === "1000+" ? 0 : data.rank,
    "Farcaster Username": data.farcasterUsername,
  }),
  total: (data: LeaderboardData) => data.points,
  rank: (data: LeaderboardData) =>
    data.rank === "1000+" ? 0 : Number(data.rank),
  supportedAddressTypes: ["fid"],
} satisfies AdapterExport<LeaderboardData>;
