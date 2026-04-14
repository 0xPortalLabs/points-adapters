import type { AdapterExport } from "../utils/adapter.ts";

// Inflynce has shut down on April 9th.
// ref: https://farcaster.xyz/inflynce/0x3844263a
export default {
  fetch: async () => await Promise.resolve({}),
  data: () => ({}),
  total: () => 0,
  claimable: () => false,
  deprecated: () => ({
    Points: 1775692800, // April 19th 2026
  }),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
