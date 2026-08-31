import type { AdapterExport } from "../utils/adapter.ts";

// Season 3 ended on July 23rd, 2026. Season 4 activity is being tracked, but
// Lombard has not published its incentives details or a supported points API.
export default {
  fetch: async () => await Promise.resolve({}),
  data: () => ({}),
  total: () => ({ Lux: 0 }),
  claimable: () => true,
  deprecated: () => ({
    Lux: 1784764800, // July 23rd 2026 00:00 UTC
  }),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
