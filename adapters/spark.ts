import type { AdapterExport } from "../utils/adapter.ts";

import { convertKeysToStartCase } from "../utils/object.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://spark2-api.blockanalitica.com/api/v1/referrals/{address}"
);

/**
 * {
  invite_code: "...",
  invited_users: 0,
  referral_code: null,
  leaderboard_position: 1,
  points: [
    { type: "pendle", amount_normalized: "410584056.211350120962807338" },
    { type: "referral", amount_normalized: "0" },
  ],
}
 */
export default {
  fetch: async (address: string) => {
    return await (
      await fetch(API_URL.replace("{address}", address), {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      })
    ).json();
  },
  data: ({
    points,
    invited_users,
  }: {
    points: { type: string; amount_normalized: string }[];
    invited_users: number;
  }) => {
    const res: Record<string, number> = { invited_users };

    points.forEach((point) => {
      res[point.type + " points"] = parseFloat(point.amount_normalized);
    });

    return convertKeysToStartCase(res);
  },
  total: ({
    points,
  }: {
    points: { type: string; amount_normalized: string }[];
  }) => {
    return points.reduce((sum, x) => sum + parseFloat(x.amount_normalized), 0);
  },
  rank: ({ leaderboard_position }: { leaderboard_position: number }) =>
    leaderboard_position,
} as AdapterExport;
