import type { AdapterExport } from "../utils/adapter.ts";

// Avalon has added signature to their API
export default {
  fetch: async () => await Promise.resolve({}),
  data: () => ({}),
  total: () => 0,
} as AdapterExport;
