import type { AdapterExport } from "../utils/adapter.ts";

import {
  convertKeysToStartCase,
  convertValuesToNormal,
} from "../utils/object.ts";

const API_URL =
  "https://infrared.finance/api/points/user/{address}?chainId=80094";

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
    return await (
      await fetch(API_URL.replace("{address}", address.toLowerCase()))
    ).json();
  },
  data: (data: Record<string, number | string>) =>
    convertKeysToStartCase(convertValuesToNormal(data)),
  total: ({ points }: { points: number }) => points,
  rank: ({ rank }: { rank: number }) => rank,
} as AdapterExport;
