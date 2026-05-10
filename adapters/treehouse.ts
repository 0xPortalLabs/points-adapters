import type { AdapterExport } from "../utils/adapter.ts";

// Points ended completely
// ref: https://x.com/TreehouseFi/status/2049383503440281909
export default {
  fetch: () => Promise.resolve({}),
  data: () => ({
    "S1 Nuts": {},
    "S2 Weekly Points": {},
  }),
  total: () => ({
    "S1 Nuts": 0,
    "S2 Weekly Points": 0,
  }),
  claimable: () => true,
  deprecated: () => ({
    "S1 Nuts": 1777446077, // Apr 29th 07:01 UTC
    "S2 Weekly Points": 1777446077, // Apr 29th 07:01 UTC
  }),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
