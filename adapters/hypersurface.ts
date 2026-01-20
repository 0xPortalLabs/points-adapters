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
    const res = await fetch(API_URL.replace("{address}", address), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    if (!res.ok)
      throw new Error(`Failed to fetch hypersurface data ${await res.text()}`);
    const data = await res.json();
    if (data.rank == null || data.state == null) {
      return {
        rank: {
          place: 0,
          total: 0,
        },
        state: {
          value: 0,
        },
      };
    }
    return data;
  },
  data: (data: API_RESPONSE) => ({
    Rank: data.rank.place,
    "Total Participants": data.rank.total,
    Points: data.state.value,
  }),
  total: (data: API_RESPONSE) => data.state.value,
  rank: (data: API_RESPONSE) => data.rank.place,
} as AdapterExport;
