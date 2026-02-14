import type { AdapterExport } from "../utils/adapter.ts";

// This service has been suspended by its owner.
export default {
  fetch: async () => await Promise.resolve({}),
  data: () => ({}),
  total: () => 0,
  claimable: () => false,
  supportedAddressTypes: ["evm"],
} as AdapterExport;
