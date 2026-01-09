import type { AdapterExport } from "../utils/adapter.ts";

// API now returns 522 error even when logged in through frontend
export default {
  fetch: async (address) => await Promise.resolve({}),
  data: (data) => ({}),
  total: (data) => 0,
  claimable: (data) => false,
} as AdapterExport;
