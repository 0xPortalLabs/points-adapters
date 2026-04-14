import type { AdapterExport } from "../utils/adapter.ts";

// S6, the final season, ended on Dec 15th.
export default {
  fetch: async () => await Promise.resolve({}),
  data: () => ({}),
  total: ({ totalScore }: Record<string, number>) => totalScore,
  rank: ({ rank }: Record<string, number>) => rank,
  deprecated: () => ({
    Points: 1765756800,
  }),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
