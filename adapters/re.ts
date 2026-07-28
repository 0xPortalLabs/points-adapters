import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://api.re.xyz/wallet/points?address={address}",
);

type RePointsResponse = {
  success: boolean;
  address: string;
  season: number;
  points: number;
  rank: number | null;
  share: number | null;
  last_update: string | null;
};

export default {
  fetch: async (address: string) => {
    const res = await fetch(API_URL.replace("{address}", address), {
      headers: {
        Accept: "application/json",
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
    });

    if (!res.ok) {
      throw new Error(`Re points request failed with status ${res.status}`);
    }

    const data = await res.json() as RePointsResponse;
    if (!data.success) {
      throw new Error("Re points request was unsuccessful");
    }

    return data;
  },
  data: (data: RePointsResponse) => ({
    "Re Points": data.points,
    Season: data.season,
    Rank: data.rank ?? 0,
    "Leaderboard Share (%)": data.share ?? 0,
    "Last Updated": data.last_update ?? "N/A",
  }),
  total: (data: RePointsResponse) => data.points,
  rank: (data: RePointsResponse) => data.rank ?? 0,
  supportedAddressTypes: ["evm"],
} as AdapterExport;
