import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://api.jumper.xyz/v1/wallets/{address}/rewards",
);
const LEADERBOARD_URL = await maybeWrapCORSProxy(
  "https://api.jumper.xyz/v1/leaderboard/{address}",
);

const RANK_TIMEOUT_MS = 1500;

const fetchLeaderboard = async (
  address: string,
  headers: Record<string, string>,
) => {
  try {
    const res = await fetch(LEADERBOARD_URL.replace("{address}", address), {
      headers,
      signal: typeof AbortSignal.timeout === "function"
        ? AbortSignal.timeout(RANK_TIMEOUT_MS)
        : undefined,
    });

    if (!res.ok) {
      throw new Error(
        `Jumper leaderboard request failed with status ${res.status}`,
      );
    }

    return await res.json();
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    ) {
      return {};
    }

    throw error;
  }
};

export default {
  fetch: async (address: string) => {
    const headers = {
      Referer: "https://checkpoint.exchange/",
      "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
    };
    const rewards = await (
      await fetch(API_URL.replace("{address}", address), { headers })
    ).json();

    const leaderboard = rewards.data.sum > 0
      ? await fetchLeaderboard(address, headers)
      : {};

    return {
      rewards,
      leaderboard,
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
          } | null;
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
            .flatMap(({ reward, points }) =>
              reward ? [[reward.name, points]] : []
            ),
        ),
      },
    };
  },
  total: ({ rewards }: { rewards: { data: { sum: number } } }) => ({
    XP: rewards.data.sum,
  }),
  rank: ({ leaderboard }: { leaderboard: { data?: { position?: string } } }) =>
    leaderboard.data?.position ? parseInt(leaderboard.data.position) : 0,
  supportedAddressTypes: ["evm", "svm"],
} as AdapterExport;
