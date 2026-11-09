// Disabled 2026-11-09: no verified public, account-scoped points lookup.
// The public stats endpoint returns totalRips (matching packs opened), while
// the app displays ripsPoints from authenticated profile/ranking endpoints.
// This retires the integration, not the points campaign; its end is unconfirmed.
// Keep network-free, including imports and CORS probes. Zero values below are
// disabled placeholders, not verified account balances.
import type { AdapterExport } from "../utils/adapter.ts";

export default {
  fetch: () => Promise.resolve(undefined),
  data: () => ({
    Rips: {
      Status: "Disabled: public account points lookup unavailable",
      Points: 0,
    },
  }),
  total: () => ({ Rips: 0 }),
  rank: () => 0,
  claimable: () => false,
  supportedAddressTypes: ["fid"],
} satisfies AdapterExport<undefined>;

/*
ARCHIVED IMPLEMENTATION — DISABLED, NOT EXECUTABLE
Preserved for possible reactivation. Verify an unauthenticated account-scoped
points endpoint against the app before restoring. Replace the disabled export
above and remove rip from monitoring/config.json's disabledAdapters; do not
simply uncomment this block. The old totalRips mapping is not verified points.

import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://rips.app/api/users/{fid}/stats"
);

export default {
  fetch: async (fid: number) => {
    const res_stats = await fetch(API_URL.replace("{fid}", String(fid)), {
      headers: { "User-Agent": "Checkpoint API (https://checkpoint.exchange)" },
    });
    const data = await res_stats.json();
    return data.stats;
  },
  data: (stats: Record<string, number>) => ({
    Rips: {
      Streak: stats.streak,
      Points: stats.totalRips,
    },
  }),
  total: (stats: Record<string, number>) => ({
    Rips: stats.totalRips,
  }),
  supportedAddressTypes: ["fid"],
} satisfies AdapterExport<Record<string, number>>;
*/
