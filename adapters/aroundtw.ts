import type { AdapterExport } from "../utils/adapter.ts";

export default {
  fetch: async () => await Promise.resolve({}),
  data: () => ({}),
  total: () => 0,
  deprecated: () => ({
    Points: 1775001600, // April 1st 2026 00:00 UTC
  }),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
