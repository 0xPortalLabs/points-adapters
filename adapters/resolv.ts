import type { AdapterExport } from "../utils/adapter.ts";

import { convertKeysToStartCase } from "../utils/object.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

// NOTE: API for leaderboard
// https://api.resolv.im/points/leaderboard?page=1
const API_URL = await maybeWrapCORSProxy(
  "https://web-api.resolv.xyz/points?address={address}"
);
const RANK_URL = await maybeWrapCORSProxy(
  "https://web-api.resolv.xyz/points/leaderboard/slice?address={address}"
);

/*
{
  totalPoints: 4350139.138155897915,
  dailyPoints: 0,
  boosts: {
    total: 100,
    epoch: { name: "Grand Epoch", value: 25 },
    tickerIsResolv: 75,
  },
  dailyActivities: {
    referralPoints: 0,
    holdUsrEth: 0,
    holdUsrBase: 0,
    holdStUsrEth: 0,
    holdRlpEth: 0
    [...]
  }
};

{
  requestedAddressIndex: 1,
  rows: [
    {
      rank: 10542,
      address: "0xc174b22096790d0e65cc3cb48c4b51e7ca1a99d9",
      points: 4350521.695522954886,
    },
    {
      rank: 10543,
      address: "0x171c53d55b1bcb725f660677d9e8bad7fd084282",
      points: 4350139.138155897915,
    },
  ],
};
*/
export default {
  fetch: async (address: string) => {
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    };

    const [data, rankData] = await Promise.all([
      (await fetch(API_URL.replace("{address}", address), { headers })).json(),
      (await fetch(RANK_URL.replace("{address}", address), { headers })).json(),
    ]);

    return { data, rankData };
  },
  data: ({ data }: { data: { dailyActivities: Record<string, number> } }) =>
    convertKeysToStartCase(data.dailyActivities),
  total: ({ data }: { data: { totalPoints: number } }) => data.totalPoints,
  rank: ({
    rankData,
  }: {
    rankData: { requestedAddressIndex?: number; rows: { rank: number }[] };
  }) => {
    return rankData.requestedAddressIndex
      ? rankData.rows[rankData.requestedAddressIndex].rank
      : 0;
  },
} as AdapterExport;
