import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://metadata.p.rainbow.me/v1/graph"
);

export default {
  fetch: async (address) => {
    const res = await fetch(API_URL, {
      headers: {
        "Content-Type": "application/json",
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
    console.log(await res.json());
    return {};
  },
} as AdapterExport;
