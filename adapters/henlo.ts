import type { AdapterExport } from "../utils/adapter.ts";

// Points program has now fully ended and API is no longer available.
export default {
  fetch: async () => await Promise.resolve({}),
  data: () => ({}),
  total: () => 0,
  claimable: () => false,
  deprecated: () => ({ Points: 1709510400 }), // March 3rd 2024 00:00 UTC
  supportedAddressTypes: ["evm"],
} as AdapterExport;
