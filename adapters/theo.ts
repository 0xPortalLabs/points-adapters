import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://app.theo.xyz/api/points?userAddress={address}"
);

type API_RESPONSE = {
  season1: number;
  season2: { points: number }[];
};

// {
//         week: 1,
//         points: 0,
//         startTimestamp: 1754611200000,
//         endTimestamp: 1755215999999
//       },
//       {
//         week: 2,
//         points: 0,
//         startTimestamp: 1755216000000,
//         endTimestamp: 1755820799999
//       },
// .......
export default {
  fetch: async (address) => {
    const res = await fetch(API_URL.replace("{address}", address));
    const data = await res.json();
    if (!data.success) return { season1: 0, season2: [] };
    return data.data;
  },
  data: (data: API_RESPONSE) => ({
    "Season 1 Points": data.season1,
    "Season 2 Points": data.season2.reduce((acc, curr) => {
      return acc + curr.points;
    }, 0),
  }),
  total: (data: API_RESPONSE) => ({
    "S2 Points": data.season2.reduce((acc, curr) => {
      return acc + curr.points;
    }, 0),
    "S1 Points": data.season1,
  }),
} as AdapterExport;
