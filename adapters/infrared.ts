import type { AdapterExport } from "../utils/adapter.ts";

// Points program has now fully ended and API is no longer available.
export default {
  fetch: async () => await Promise.resolve({}),
  data: () => ({}),
  total: () => 0,
  claimable: () => true, // Airdrop ends on 12th January 2026
  deprecated: () => ({
    Points: 1762359104, // Wednesday 5th November 2025 16:11 GMT
  }),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
