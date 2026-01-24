import type { AdapterExport } from "../utils/adapter.ts";

// API requires signing in
export default {
  fetch: async () => await Promise.resolve({}),
  data: () => ({}),
  total: () => 0,
  claimable: () => false,
} as AdapterExport;
