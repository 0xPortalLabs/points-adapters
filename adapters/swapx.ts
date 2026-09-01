import type { AdapterExport } from "../utils/adapter.ts";

export default {
  fetch: async () => await Promise.resolve({}),
  data: () => ({}),
  total: () => 0,
  deprecated: () => ({
    Points: 1766448000, // December 23rd 2025 00:00 UTC
  }),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
