import type { AdapterExport } from "../utils/adapter.ts";

// Points program has now fully ended and API is no longer available.
export default {
  fetch: async () => await Promise.resolve({}),
  data: () => ({}),
  total: () => 0,
  claimable: () => false,
  deprecated: () => ({ Points: 1761955200 }), // Nov 1st 00:00 UTC
  supportedAddressTypes: ["evm"],
} as AdapterExport;
