import type { AdapterExport } from "../utils/adapter.ts";

export default {
  fetch: async () => ({}),
  data: () => ({}),
  total: () => 0,
  supportedAddressTypes: ["evm"],
} as AdapterExport;
