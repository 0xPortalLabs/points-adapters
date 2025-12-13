import type { AdapterExport } from "../utils/adapter.ts";

// Kinetiq API has added a signature to their api
export default {
  fetch: async () => await Promise.resolve({}),
  data: () => ({}),
  total: () => 0,
  deprecated: () => ({
    kPoints: 1760572800, // October 16th 2025 GMT
  }),
} as AdapterExport;
