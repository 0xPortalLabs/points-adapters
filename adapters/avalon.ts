import type { AdapterExport } from "../utils/adapter.ts";

export default {
  fetch: async () => await Promise.resolve({}),
  data: () => ({}),
  total: () => 0,
  deprecated: () => ({
    Points: 1788134400, // August 31st 2026 00:00 UTC
  }),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
