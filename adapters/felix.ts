import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";
import { getAddress } from "viem";

const API_URL = await maybeWrapCORSProxy(
  "https://www.usefelix.xyz/api/points/{address}"
);

export default {
  fetch: async (address) => {
    const response = await fetch(
      API_URL.replace("{address}", getAddress(address)),
      {
        headers: { "User-Agent": "Checkpoint API (https://checkpoint.exchange)" },
      }
    );
    return await response.json();
  },
  data: (data) => {
    if (!data || !Array.isArray(data)) return {};
    let epochObj: Record<string, number> = {};
    data.forEach((entry) => {
      if (entry.epochNumber && entry.pointsEarned) {
        const epochKey = `Epoch #${entry.epochNumber}`;
        epochObj[epochKey] = entry.pointsEarned;
      }
    });
    return epochObj;
  },
  total: (data) => {
    if (!data || !Array.isArray(data)) return 0;
    return data.reduce((total, entry) => total + (entry.pointsEarned || 0), 0);
  },
} as AdapterExport;
