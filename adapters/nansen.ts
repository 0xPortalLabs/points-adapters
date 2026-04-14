import { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";
import { convertKeysToStartCase } from "../utils/object.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://app.nansen.ai/api/points-leaderboard/{address}"
);

// 0x6E93Ebc8302890fF1D1BeFd779D1DB131eF30D4d - Testing address
// { tier: "star", points: 1540069 }
export default {
  fetch: async (address: string) => {
    const res = await fetch(API_URL.replace("{address}", address), {
      headers: { "User-Agent": "Checkpoint API (https://checkpoint.exchange)" },
    });

    return await res.json();
  },
  data: (data: { points: number; tier: string }) => {
    if (!data) return {};
    return convertKeysToStartCase({
      points: data.points,
      tier: data.tier,
    });
  },
  total: (data: { points: number }) => {
    if (!data) return 0;
    return data.points;
  },
  supportedAddressTypes: ["evm", "svm"],
} as AdapterExport;
