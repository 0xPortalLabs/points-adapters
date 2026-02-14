import type { AdapterExport } from "../utils/adapter.ts";

export default {
  fetch: async () => await Promise.resolve({}),
  data: () => ({}),
  total: () => 0,
  supportedAddressTypes: ["evm"],
} as AdapterExport;
