import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://api.jumper.exchange/v1/wallets/{address}/rewards"
);
const LEADERBOARD_URL = await maybeWrapCORSProxy(
  "https://api.jumper.exchange/v1/leaderboard/{address}"
);

export default {
  fetch: async (address: string) => {
    const headers = {
      Referer: "https://checkpoint.exchange/",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    };
    const [rewards, leaderboard] = await Promise.all([
      await fetch(API_URL.replace("{address}", address), { headers }),
      await fetch(LEADERBOARD_URL.replace("{address}", address), { headers }),
    ]);

    return {
      rewards: await rewards.json(),
      leaderboard: await leaderboard.json(),
    };
  },
  data: ({
    rewards,
  }: {
    rewards: {
      data: {
        sum: number;
        level: number;
        walletRewards: Array<{
          points: number;
          reward: {
            name: string;
          };
        }>;
      };
    };
  }) => {
    const { data } = rewards;

    return {
      XP: {
        Total: data.sum,
        Level: data.level,
        ...Object.fromEntries(
          data.walletRewards
            .filter((reward) => reward.reward !== null)
            .map(({ reward, points }) => [reward.name, points])
        ),
      },
    };
  },
  total: ({ rewards }: { rewards: { data: { sum: number } } }) => ({
    XP: rewards.data.sum,
  }),
  rank: ({ leaderboard }: { leaderboard: { data?: { position?: string } } }) =>
    leaderboard.data?.position ? parseInt(leaderboard.data.position) : 0,
} as AdapterExport;
