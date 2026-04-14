import type { AdapterExport } from "../utils/adapter.ts";

// S6, the final season, ended on Dec 15th.
export default {
  fetch: async () => await Promise.resolve({}),
  data: () => ({}),
  total: () => 0,
  claimable: () => true,
  deprecated: () => ({
    Points: 1765756800, // Dec 15th 2025
  }),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
