import type { AdapterExport } from "../utils/adapter.ts";

// The ledger now requires a wallet signature; public address-only reads fail.
// This timestamp records integration retirement, not the end of the Peaks programme.
export default {
  fetch: () => Promise.resolve({}),
  data: () => ({ Peaks: {} }),
  total: () => ({ Peaks: 0 }),
  claimable: () => false,
  deprecated: () => ({
    Peaks: 1790294400, // September 25th 2026 00:00 UTC
  }),
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport;
