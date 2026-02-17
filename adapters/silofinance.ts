import type { AdapterExport } from "../utils/adapter.ts";

// Silo Finance points API has been deprecated and this adapter is no longer active.
export default {
  fetch: async () => await Promise.resolve({}),
  data: () => ({}),
  total: () => 0,
  claimable: () => false,
  deprecated: () => ({
    Points: 1753660800, // July 28th 2025 00:00 UTC
  }),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
