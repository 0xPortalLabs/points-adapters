import type { AdapterExport } from "../utils/adapter.ts";

// Error: Service Unavailable
// Service is disabled
// Project seems dead?
export default {
  fetch: async () => await Promise.resolve({}),
  data: () => ({}),
  total: () => 0,
  claimable: () => false,
  supportedAddressTypes: ["evm"],
} as AdapterExport;
