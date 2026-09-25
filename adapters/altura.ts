import type { AdapterExport } from "../utils/adapter.ts";

// Integration retired on September 25, 2026.
// Season 5's timestamp records integration retirement, not a programme end date.
export default {
  fetch: () => Promise.resolve({}),
  data: () => ({
    "Season 1": {},
    "Season 2": {},
    "Season 3": {},
    "Season 4": {},
    "Season 5": {},
  }),
  total: () => ({ "Season 5": 0 }),
  claimable: () => false,
  deprecated: () => ({
    "Season 1": 1771545600, // February 20th 2026 00:00 UTC
    "Season 2": 1775174400, // April 3rd 2026 00:00 UTC
    "Season 3": 1777766400, // May 3rd 2026 00:00 UTC
    "Season 4": 1783468800, // July 8th 2026 00:00 UTC
    "Season 5": 1790294400, // September 25th 2026 00:00 UTC
  }),
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport;
