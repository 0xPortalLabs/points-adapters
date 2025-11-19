import type { AdapterExport } from "../utils/adapter.ts";

import { checksumAddress } from "viem";

import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy("https://kinetiq.xyz/kpoints");

// 0:{"a":"$@1","f":"","b":"RlJjJG8BajH16-DM4LyPm"}
// 1:{"address":"0x12...","points":0,"tier":"Bush"}
export default {
  fetch: async (address: string) => {
    address = checksumAddress(address as `0x${string}`);

    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify([{ chainId: 1, userAddress: address }]),
      headers: {
        "next-action": "7fe98e616734232bdb03a27d671f1ea032ddd6ebed",
      },
    });

    const lines = (await res.text()).split("\n").filter((l) => l.trim());
    const data = lines.find((l) => l.includes("address"));
    if (!data) throw new Error("invalid response format");

    // Remove "1:" prefix.
    return JSON.parse(data.slice(2));
  },
  data: (data: { rank?: number; tier: string }) => ({
    kPoints: {
      Tier: data.tier,
      Rank: data.rank,
    },
  }),
  total: (data: { points: number }) => ({ kPoints: data.points }),
  rank: (data: { rank?: number }) => data.rank || 0,
  deprecated: () => ({
    kPoints: 1760572800, // October 16th 2025 GMT
  }),
} as AdapterExport;
