import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://api.prjx.com/points/user?walletAddress={address}",
);

type API_RESPONSE = {
  pointsTotal: number;
  rank: number;
};

export default {
  fetch: async (address: string) => {
    const res = await fetch(API_URL.replace("{address}", address));

    return await res.json();
  },
  data: (_) => ({}),
  total: (data: API_RESPONSE) => (data ? data.pointsTotal : 0),
  rank: (data: API_RESPONSE) => (data ? data.rank : 0),
} as AdapterExport;
