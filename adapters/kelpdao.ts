import type { AdapterExport } from "../utils/adapter.ts";

// Season 4 ended on February 28, 2026.
// https://forum.kerneldao.com/t/governance-proposal-airdrop-season-4-rewards/531
// The historical miles API now fails with ResourceNotFoundException. This
// retired adapter reports no active points, not a wallet's historical balance.
export default {
  fetch: async () => await Promise.resolve({}),
  data: () => ({ "Kernel Points": {} }),
  total: () => ({ "Kernel Points": 0 }),
  // Historical miles do not establish an unclaimed token allocation.
  deprecated: () => ({
    "Kernel Points": 1772236800, // February 28th 2026 00:00 UTC
  }),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
