import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";
import { getAddress } from "viem";

const API_URL = await maybeWrapCORSProxy(
  "https://www.usefelix.xyz/api/points/{address}"
);

function getTotalPoints(data: Record<string, number>[]) {
  return data.reduce((total, entry) => total + (entry.pointsEarned || 0), 0);
}

export default {
  fetch: async (address) => {
    const response = await fetch(
      API_URL.replace("{address}", getAddress(address))
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
    return getTotalPoints(data);
  },
} as AdapterExport;
