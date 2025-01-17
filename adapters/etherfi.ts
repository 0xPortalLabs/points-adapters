import type { AdapterExport } from "../utils/adapter.ts";

const API_URL = "https://app.ether.fi/api/portfolio/v3/{address}";

export default {
  fetch: async (address: string) => {
    return await (await fetch(API_URL.replace("{address}", address))).json();
  },
  points: (data: Record<string, number>) => data, // TODO:
  total: (data: {
    totalPointsSummaries: Record<string, { CurrentPoints: number }>;
  }) =>
    Object.values(data.totalPointsSummaries).reduce(
      (x, y) => x + y.CurrentPoints,
      0
    ),
} as AdapterExport;
