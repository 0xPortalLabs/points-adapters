import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";
import { formatEther } from "viem";

const API_URL = await maybeWrapCORSProxy(
  "https://metadata.p.rainbow.me/v1/graph"
);

type API_RESPONSE = {
  earnings: { total: number };
  rewards: {
    total: string;
    claimable: number | string;
    claimed: string;
  };
  stats: {
    position: {
      unranked: boolean;
      current: number;
    };
  };
};

export default {
  fetch: async (address) => {
    const res = await fetch(API_URL, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer cYTvNiT7WQaQXCXVsbBn7H9cyxboFCQ3",
      },
      method: "POST",
      body: JSON.stringify({
        query: `query getPointsDataForWallet($address: String!) {
    points(address: $address) {
      error { message type }
      meta { distribution { next } status rewards { total } }
      leaderboard {
        stats { total_users total_points rank_cutoff }
        accounts { address earnings { total } ens avatarURL }
      }
      user {
        referralCode
        earnings_by_type { type earnings { total } }
        earnings { total }
        rewards { total claimable claimed }
        stats {
          position { unranked current }
          referral { total_referees qualified_referees }
          last_airdrop {
            position { unranked current }
            earnings { total }
            differences { type group_id earnings { total } }
          }
          last_period {
            position { unranked current }
            earnings { total }
          }
        }
      }
    }
  }`,
        variables: { address },
      }),
    });
    const data = await res.json();
    return data.data.points.user;
  },
  data: (data: API_RESPONSE) => {
    const isUnranked = !!data.stats.position.unranked;
    const rank = isUnranked ? 0 : data.stats.position.current;
    const points = data.earnings.total;
    const claimable = data.rewards.claimable;

    return {
      Points: points,
      Rank: rank,
      Unranked: isUnranked ? "Yes" : "No",
      Claimable: claimable && claimable !== "0" ? "Yes" : "No",
      Rewards: `${formatEther(claimable as bigint)} ETH`,
    };
  },
  total: (data: API_RESPONSE) => Number(data.earnings.total),
  rank: (data: API_RESPONSE) => data.stats.position.current,
  claimable: (data: API_RESPONSE) => {
    const claimable = data.rewards.claimable;
    return claimable && claimable !== "0";
  },
} as AdapterExport;
