import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const USER_STATS_URL = await maybeWrapCORSProxy(
  "https://api.liquidmax.xyz/api/data/user_stats?wallet_address={address}"
);

const RANK_URL = await maybeWrapCORSProxy(
  "https://api.liquidmax.xyz/api/leaderboard/v2/check-rank?wallet={address}&metric=pnl&duration=all_time"
);

type USER_STATS_RESPONSE = {
  total_points: number;
  total_volume: number;
  directional_bias: {
    long_percentage: number;
    short_percentage: number;
  } | null;
  trading_streak: {
    current_streak: number;
  } | null;
};

type RANK_RESPONSE = {
  rank: number | null;
};

type API_RESPONSE = {
  userStats: USER_STATS_RESPONSE;
  rank: RANK_RESPONSE;
};

const headers = {
  "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
};

export default {
  fetch: async (address) => {
    const checksumAddress = getAddress(address);

    const [userStatsResponse, rankResponse] = await Promise.all([
      fetch(USER_STATS_URL.replace("{address}", checksumAddress), { headers }),
      fetch(RANK_URL.replace("{address}", checksumAddress), { headers }),
    ]);

    if (!userStatsResponse.ok) {
      throw new Error(
        `liquid user stats api error: ${userStatsResponse.statusText}`
      );
    }

    if (!rankResponse.ok) {
      throw new Error(`liquid rank api error: ${rankResponse.statusText}`);
    }

    const [userStats, rank] = await Promise.all([
      userStatsResponse.json() as Promise<USER_STATS_RESPONSE>,
      rankResponse.json() as Promise<RANK_RESPONSE>,
    ]);

    return {
      userStats,
      rank,
    };
  },
  data: (data: API_RESPONSE) => ({
    Points: data.userStats.total_points,
    Rank: data.rank.rank ?? 0,
    Volume: data.userStats.total_volume,
    "Current Streak": data.userStats.trading_streak?.current_streak ?? 0,
    "Long Directional Bias": `${
      data.userStats.directional_bias?.long_percentage ?? 0
    }%`,
    "Short Directional Bias": `${
      data.userStats.directional_bias?.short_percentage ?? 0
    }%`,
  }),
  total: (data: API_RESPONSE) => data.userStats.total_points,
  rank: (data: API_RESPONSE) => data.rank.rank ?? 0,
  supportedAddressTypes: ["evm"],
} as AdapterExport;
