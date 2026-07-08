import type { AdapterExport } from "../utils/adapter.ts";

type API_RESPONSE = {
  season1: number;
  season2: { points: number }[];
};

const emptyResponse = (): API_RESPONSE => ({
  season1: 0,
  season2: [],
});

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
  fetch: async () => await Promise.resolve(emptyResponse()),
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
  deprecated: () => ({
    "Season 1 Points": 1783468800, // July 8th 2026 00:00 UTC
    "Season 2 Points": 1783468800, // July 8th 2026 00:00 UTC
  }),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
