import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";
import { getAddress } from "viem";

const API_URL = await maybeWrapCORSProxy(
  "https://www.usefelix.xyz/api/points/{address}"
);

export default {
  fetch: async (address) => {
    const response = await fetch(
      API_URL.replace("{address}", getAddress(address))
    );
    return await response.json();
  },
  data: (data) => {
    if (!data || !Array.isArray(data)) return {};

    let totalPoints = 0;

    data.forEach((entry) => {
      if (entry.pointsEarned) {
        totalPoints += entry.pointsEarned;
      }
    });

    return { totalPoints };
  },
  total: (data) => {
    if (!data || !Array.isArray(data)) return 0;

    const totalPoints = data.reduce(
      (sum, entry) => sum + (entry.pointsEarned || 0),
      0
    );
    return totalPoints;
  },
} as AdapterExport;
