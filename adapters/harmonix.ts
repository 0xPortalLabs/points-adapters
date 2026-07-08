import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

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

type API_RESPONSE = {
  points: POINTS_TYPE[];
  rank?: Partial<TIER_TYPE>;
};

export default {
  fetch: async (address: string): Promise<API_RESPONSE> => {
    const headers = {
      headers: { "User-Agent": "Checkpoint API (https://checkpoint.exchange)" },
    };
    const pointsResponse = await fetch(
      POINTS_URL.replace("{address}", address),
      headers,
    );

    if (!pointsResponse.ok) {
      throw new Error(
        `Harmonix points request failed with status ${pointsResponse.status}`,
      );
    }

    const points = await pointsResponse.json() as POINTS_TYPE[];
    let rank: Partial<TIER_TYPE> | undefined;

    if (points.length > 0) {
      const rankResponse = await fetch(
        TIER_URL.replace("{address}", address),
        headers,
      );

      if (rankResponse.ok) {
        rank = await rankResponse.json();
      } else if (rankResponse.status !== 404) {
        throw new Error(
          `Harmonix tier request failed with status ${rankResponse.status}`,
        );
      }
    }

    return {
      points,
      rank,
    };
  },
  data: (data: API_RESPONSE) => {
    const totalsBySeason: Record<
      string,
      { points: number; staking_points: number; referral_points: number }
    > = {};

    for (const season of data.points) {
      const seasonType = season.season_type;
      if (seasonType !== "season_1" && seasonType !== "season_2") continue;
      if (totalsBySeason[seasonType]) continue; // keep first match like find()

      let points = 0;
      let stakingPoints = 0;
      let referralPoints = 0;

      for (const session of season.data) {
        points += session.points;
        stakingPoints += session.staking_points;
        referralPoints += session.referral_points;
      }

      totalsBySeason[seasonType] = {
        points,
        staking_points: stakingPoints,
        referral_points: referralPoints,
      };
    }

    const output: Record<string, number | string | undefined> = {};
    const season2 = totalsBySeason["season_2"];
    if (season2) {
      output["Season 2 Points"] = season2.points;
      output["Season 2 Staking Points"] = season2.staking_points;
      output["Season 2 Referral Points"] = season2.referral_points;
    }

    const season1 = totalsBySeason["season_1"];
    if (season1) {
      output["Season 1 Points"] = season1.points;
      output["Season 1 Staking Points"] = season1.staking_points;
      output["Season 1 Referral Points"] = season1.referral_points;
    }

    output["Tier"] = data.rank?.tier;
    output["Tenure Achieved"] = data.rank?.tenure_achieved;

    return output;
  },
  total: (data: API_RESPONSE) => {
    let s1Total: number | undefined;
    let s2Total: number | undefined;

    for (const season of data.points) {
      if (season.season_type === "season_1") {
        if (s1Total !== undefined) continue; // keep first match like find()
        let total = 0;
        for (const session of season.data) {
          total += session.points +
            session.staking_points +
            session.referral_points +
            session.swap_points;
        }
        s1Total = total;
        continue;
      }

      if (season.season_type === "season_2") {
        if (s2Total !== undefined) continue; // keep first match like find()
        let total = 0;
        for (const session of season.data) {
          total += session.points +
            session.staking_points +
            session.referral_points +
            session.swap_points;
        }
        s2Total = total;
      }
    }

    return {
      "S2 Points": s2Total,
      "S1 Points": s1Total,
    };
  },
  claimable: (data: API_RESPONSE) => {
    for (const season of data.points) {
      if (season.season_type !== "season_1") continue;
      for (const session of season.data) {
        if (session.points > 0) return true;
      }
      return false;
    }
    return false;
  },
  deprecated: (data: API_RESPONSE) =>
    data.points.some((season) => season.season_type === "season_1")
      ? { "Season 1 Points": 1738367999 } // 31st January 2025
      : {},
  supportedAddressTypes: ["evm"],
} as AdapterExport;
