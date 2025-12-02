import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";
import { convertKeysToStartCase } from "../utils/object.ts";

const POINTS_URL = await maybeWrapCORSProxy(
  "https://api.harmonix.fi/api/v1/points/users/{address}/points",
);

const TIER_URL = await maybeWrapCORSProxy(
  "https://api.harmonix.fi/api/v1/users/tier?wallet_address={address}",
);

type DATA_TYPE = {
  points: number;
  staking_points: number;
  referral_points: number;
  swap_points: number;
  start_date: string;
  end_date: null;
  session_name: string;
  partner_name: string;
};

type POINTS_TYPE = {
  season_type: string;
  data: DATA_TYPE[];
};

type TIER_TYPE = {
  tier: string;
  tenure_achieved: number;
  silver_fallback_indicator: boolean;
};

export default {
  fetch: async (address) => {
    const pointsData = await fetch(POINTS_URL.replace("{address}", address));
    const rankData = await fetch(TIER_URL.replace("{address}", address));

    return {
      points: await pointsData.json(),
      rank: await rankData.json(),
    };
  },
  data: (data: { points: POINTS_TYPE[]; rank: TIER_TYPE }) => {
    return convertKeysToStartCase({
      ...Object.fromEntries(
        data.points.map((season) => [
          season.season_type,
          season.data.reduce((acc, session) => acc + session.points, 0),
        ]),
      ),
      tier: data.rank?.tier,
      tenure_achieved: data.rank?.tenure_achieved,
    });
  },
  total: (data: { points: POINTS_TYPE[] }) => {
    const season2 = data.points.find(
      (season) => season.season_type === "season_2",
    );
    return season2?.data.reduce((acc, session) => acc + session.points, 0);
  },
  claimable: (data: { points: POINTS_TYPE[] }) => {
    const season1 = data.points.find(
      (season) => season.season_type === "season_1",
    );
    return Boolean(
      season1?.data.reduce((acc, session) => acc + session.points, 0),
    );
  },
  deprecated: () => ({
    "Season 1": 1738367999, // 31st January 2025
  }),
} as AdapterExport;
