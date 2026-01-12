import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://api.prjx.com/points/user?walletAddress={address}"
);

type API_RESPONSE = {
  pointsTotal: number;
  rank: number;
};

export default {
  fetch: async (address: string) => {
    const res = await fetch(API_URL.replace("{address}", address), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    const data = await res.json();
    if (data.error === "User not found") return { pointsTotal: 0, rank: 0 };

    return data;
  },
  data: (data: API_RESPONSE) => {
    if (!data) return {};
    return {
      "Total Points": data.pointsTotal,
      Rank: data.rank,
    };
  },
  total: (data: API_RESPONSE) => data.pointsTotal,
  rank: (data: API_RESPONSE) => data.rank,
} as AdapterExport;
