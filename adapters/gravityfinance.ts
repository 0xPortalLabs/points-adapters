import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

/* const API_URL = await maybeWrapCORSProxy(
  "https://rewards-api-gravityfinance.com/reward_summary?wallet_addr={address}"
); */

/*
{
  X2Boost: false,
  gravityStars: {
    totalPoints: 35909526.0,
    activities: [
      {
        activityId: "gfiMigration",
        activityName: "GFI Sonic Migration",
        activityDescription: "GFI Sonic Migration",
        pointsEarned: 35909526.0,
        percentageActivityPoints: 0.03848745631262357,
        X2BoostApplied: false,
        events: [
          {
            eventBlockNumber: 66105345,
            eventTransactionHash:
              "0x6f664f255dd8e428f0d68cea9683011874f13dc8679d144bab1b0ec701fec798",
            amount: 17954762.065720838,
          },
        ],
      },
    ],
  },
}
*/
export default {
  fetch: async (address: string) => {
    // API currently disabled/not working
    throw new Error("Gravity Finance adapter is currently disabled - API endpoint not available");
    /* const data = await (
      await fetch(API_URL.replace("{address}", address))
    ).json();

    return data?.[address.toLowerCase()] ?? data.error; */
  },
  data: (data: {
    gravitySGems?: {
      activities: Record<string, string | number>[];
    };
    gravityStars?: {
      activities: Record<string, string | number>[];
    };
  }) => {
    const gravityStars = data?.gravityStars
      ? Object.fromEntries(
          data.gravityStars.activities.map((x) => [
            x.activityName,
            x.tokensAwarded,
          ])
        )
      : {};

    const gravitySGems = data?.gravitySGems
      ? Object.fromEntries(
          data.gravitySGems.activities.map((x) => [
            x.activityName,
            x.tokensAwarded,
          ])
        )
      : {};

    return { "Gravity Stars": gravityStars, "Gravity S Gems": gravitySGems };
  },
  total: ({
    gravityStars,
    gravitySGems,
  }: {
    gravityStars?: { totalTokens: number };
    gravitySGems?: { totalTokens: number };
  }) => ({
    "Gravity Stars": gravityStars?.totalTokens ?? 0,
    "Gravity S Gems": gravitySGems?.totalTokens ?? 0,
  }),
} as AdapterExport;
