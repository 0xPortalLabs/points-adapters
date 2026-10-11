import type { AdapterExport } from "../utils/adapter.ts";

// Hypersurface has shut down completely.
// Ref: https://x.com/hypersurfaceX/status/2097672117781512509
export default {
  fetch: async () => await Promise.resolve({}),
  data: () => ({}),
  total: () => 0,
  claimable: () => false,
  deprecated: () => ({ Points: 1788958980 }), // Sep 9th 2026 13:03 UTC
  supportedAddressTypes: ["evm"],
} as AdapterExport;
