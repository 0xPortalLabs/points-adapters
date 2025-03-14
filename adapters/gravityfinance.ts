import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://gfi-rewards.ridgetech.biz/reward_summary?wallet_addr={address}&validate_addresses=true"
);

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
    const data = await (
      await fetch(API_URL.replace("{address}", address))
    ).json();

    return data?.[address.toLowerCase()] ?? data.error;
  },
  points: (data: {
    gravityStars?: {
      activities: Record<string, string | number>[];
    };
  }) => {
    const gravityStars = data?.gravityStars
      ? Object.fromEntries(
          data.gravityStars.activities.map((x) => [
            x.activityName,
            x.pointsEarned,
          ])
        )
      : {};

    return { "Gravity Stars": gravityStars };
  },
  total: (data: { gravityStars?: { totalPoints: number } }) => ({
    "Gravity Stars": data.gravityStars?.totalPoints ?? 0,
  }),
} as AdapterExport;
