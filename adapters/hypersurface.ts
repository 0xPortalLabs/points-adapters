import type { AdapterExport } from "../utils/adapter.ts";

import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://points-api.hypersurface.io/points/{address}/state/"
);

type API_RESPONSE = {
  rank: {
    place: number;
    total: number;
  };
  state: {
    value: number;
  };
};

export default {
  fetch: async (address) => {
    const res = await fetch(API_URL.replace("{address}", address));
    return await res.json();
  },
  data: (data: API_RESPONSE) => ({
    Rank: data.rank?.place ?? 0,
    "Total Participants": data.rank?.total ?? 0,
    Points: data.state?.value ?? 0,
  }),
  total: (data: API_RESPONSE) => data.state?.value ?? 0,
  rank: (data: API_RESPONSE) => data.rank?.place ?? 0,
} as AdapterExport;
