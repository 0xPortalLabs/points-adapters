import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://rewards.superform.xyz/api/proxy/rewards/summary/{address}"
);

/**
  $schema:
    "https://api.superform.xyz/schemas/Season3RewardsSummaryResponse.json",
  epoch: {
    id: 0,
    total_points_earned: 35787548944.03396,
    total_participants: 170633,
    from_timestamp: "2025-04-21T13:01:00Z",
    to_timestamp: "2099-05-20T11:00:00Z",
  },
  user: {
    points: 70.47792931973801,
    points_per_day: 1.0249004944372277,
    referrals_direct: 0,
    referrals_indirect: 0,
  },
  season_1: { user_points: 81681.83, total_points: 914430753.69 },
  season_2: { user_points: 692440.89, total_points: 68536701069.25 },
};
 */
export default {
  fetch: async (address: string) => {
    return await (await fetch(API_URL.replace("{address}", address))).json();
  },
  data: ({ user }: { user: Record<string, number> }) => ({
    Points: user.points,
    "Points Per Day": user.points_per_day,
    "Referrals Direct": user.referrals_direct,
    "Referrals Indirect": user.referrals_indirect,
  }),
  total: ({
    user,
    season_1,
    season_2,
  }: {
    user: { points: number };
    season_1: { user_points: number };
    season_2: { user_points: number };
  }) => ({
    "S1 XP": season_1.user_points,
    "S2 Cred": season_2.user_points,
    "Superform Points": user.points,
  }),
} as AdapterExport;
