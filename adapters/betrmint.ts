import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";
import { getFidFromCustodyAddress } from "../utils/farcaster.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://betrmint.fun/leaderboard/{fid}"
);

export default {
  fetch: async (address) => {
    const res = await fetch(
      API_URL.replace(
        "{fid}",
        String(await getFidFromCustodyAddress(getAddress(address)))
      )
    );

    const data = await res.json();
    return data;
  },
  data: (data: { position: number; score: number }) => ({
    Position: data.position,
    Karma: data.score
  }),
  total: (data: { position: number; score: number }) => ({
    Karma: data.score
  })
} as AdapterExport;
