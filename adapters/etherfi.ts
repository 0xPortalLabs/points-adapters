import type { AdapterExport } from "../utils/adapter.ts";

// Traditional points ended with Season 5 on May 31, 2025.
// https://governance.ether.fi/t/10-ethfi-dao-proposal-season-5/2786
// Member Rewards replaced seasonal points starting June 1, 2025:
// https://governance.ether.fi/t/ether-fi-member-rewards/2974
// Use the June 1 UTC date boundary; no exact cutoff time was published.
// Do not query the retired portfolio API or conflate this with Membership Points.
export default {
  fetch: () => Promise.resolve({}),
  data: () => ({}),
  total: () => 0,
  claimable: () => false,
  deprecated: () => ({ Points: 1748736000 }),
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport;
