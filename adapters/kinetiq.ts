import type { AdapterExport } from "../utils/adapter.ts";

// API now requires wallet signature
export default {
  fetch: async (address) => await Promise.resolve({}),
  data: (data) => ({}),
  total: (data) => 0,
  claimable: (data) => false,
  deprecated: (data) => ({
    kPoints: 1760572800, // October 16th 2025 GMT
  }),
} as AdapterExport;
