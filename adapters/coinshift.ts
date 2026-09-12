import type { AdapterExport } from "../utils/adapter.ts";

// Disabled to prevent outbound requests while Coinshift's domain routing is unsafe.
export default {
  fetch: async () => undefined,
  data: () => ({
    "Season 2 Points": 0,
    Rank: 0,
  }),
  total: () => 0,
  rank: () => 0,
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<undefined>;
