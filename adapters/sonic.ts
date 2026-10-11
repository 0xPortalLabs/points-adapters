import type { AdapterExport } from "../utils/adapter.ts";

// Sonic Points ended on November 1, 2025; the OpenBlock points API is retired.
// https://docs.soniclabs.com/funding/sonic-airdrop/sonic-points
// Remaining airdrop allocations must be claimed before October 15, 2026.
// https://www.soniclabs.com/blog/sonic-airdrop-burn-and-final-claim-deadline
export default {
  fetch: async () => await Promise.resolve({}),
  data: () => ({}),
  total: () => 0,
  // Program-level availability, not a wallet eligibility check.
  claimable: () => Date.now() < Date.parse("2026-10-15T00:00:00Z"),
  deprecated: () => ({
    Points: 1761955200, // November 1st 2025 00:00 UTC
  }),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
