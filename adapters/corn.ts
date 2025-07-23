import type { AdapterExport } from "../utils/adapter.ts";

// Corn Kernels are no longer claimable and have been returned to the network.
// ref: https://x.com/use_corn/status/1905261595682652301
export default {
  fetch: async () => await Promise.resolve({}),
  data: () => ({}),
  total: () => 0,
  claimable: () => false,
  deprecated: () => ({
    Kernels: 1743120000, // March 28th 2025 00:00 UTC
  }),
} as AdapterExport;
