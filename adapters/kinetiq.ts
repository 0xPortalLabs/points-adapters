import type { AdapterExport } from "../utils/adapter.ts";

// API now requires wallet signature
export default {
  fetch: async () => await Promise.resolve({}),
  data: () => ({ kPoints: {} }),
  total: () => ({ kPoints: 0 }),
  claimable: () => false,
  deprecated: () => ({
    kPoints: 1760572800, // October 16th 2025 GMT
  }),
} as AdapterExport;
