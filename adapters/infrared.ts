import type { AdapterExport } from "../utils/adapter.ts";

import {
  convertKeysToStartCase,
  convertValuesToNormal,
} from "../utils/object.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://infrared.finance/api/points/user/{address}?chainId=80094",
);

/**
 * {
  change_24h_percent: 0.00357901741278315,
  points: 243692.3138659346,
  points_percent: 0.010865683238629048,
  rank: 1,
  timestamp: "2025-04-24T14:31:32Z",
};
 */
export default {
  fetch: async (address: string) => {
    const res = await fetch(
      API_URL.replace("{address}", address.toLowerCase()),
    );

    if (!res.ok)
      throw new Error(`Failed to fetch infrared data ${await res.text()}`);
    return await res.json();
  },
  data: (data: Record<string, number | string>) =>
    convertKeysToStartCase(convertValuesToNormal(data)),
  total: ({ points }: { points: number }) => points,
  rank: ({ rank }: { rank: number }) => rank,
  deprecated: () => ({
    Points: 1762359104, // Wednesday 5th November 2025 16:11 GMT
  }),
} as AdapterExport;
