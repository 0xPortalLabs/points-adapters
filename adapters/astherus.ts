import type { AdapterExport } from "../utils/adapter.ts";

// API requires signing in
export default {
  fetch: async () => ({}),
  data: () => ({}),
  total: () => 0,
  claimable: () => false,
  supportedAddressTypes: ["evm"],
} as AdapterExport;
