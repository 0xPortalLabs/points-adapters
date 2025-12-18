import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";
import { convertKeysToStartCase } from "../utils/object.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://eth-api.infinifi.xyz/api/points/v2/user/{address}",
);

type V2_POINTS = {
  episode: number;
  chapter: number;
  points: number;
  isFinalized: boolean;
  referralPoints: number;
};

export default {
  fetch: async (address) => {
    const res = await fetch(API_URL.replace("{address}", address));
    return (await res.json()).data;
  },
  data: (data: {
    v1Points: number;
    v2Points: V2_POINTS[];
    stats: Record<string, number>;
    lastUpdateTimestampSec: number;
  }) => {
    const s2_points = data.v2Points.reduce((acc, curr) => {
      return (curr.points || 0) + (curr.referralPoints || 0) + acc;
    }, 0);
    const { v2Points, stats, lastUpdateTimestampSec, ...rest } = data;
    return {
      ...convertKeysToStartCase(rest),
      "V2 Points": s2_points,
    };
  },
  total: (data: { v2Points: V2_POINTS[] }) => {
    const points = data.v2Points.reduce((acc, curr) => {
      return (curr.points || 0) + (curr.referralPoints || 0) + acc;
    }, 0);
    return points;
  },
  rank: (data: { rank: number }) => data.rank,
  deprecated: () => ({
    "V1 Points": 1764547200, // December 1st 2025
  }),
} as AdapterExport;
