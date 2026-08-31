import type { AdapterExport } from "../utils/adapter.ts";

export default {
  fetch: async () => await Promise.resolve({}),
  data: () => ({ Caps: {} }),
  total: () => ({ Caps: 0 }),
  deprecated: () => ({
    Caps: 1784764800, // July 23rd 2026 00:00 UTC
  }),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
