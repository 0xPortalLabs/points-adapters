// Disabled 2026-10-12 after repeated points API timeouts and a confirmed HTTP 522.
// Trading has resumed, but points service and accrual remain unverified.
// Keep this module network-free until the points endpoint is verified and
// reactivation is explicitly approved. Zero values below are placeholders,
// not verified wallet balances.
import type { AdapterExport } from "../utils/adapter.ts";

export default {
  fetch: () => Promise.resolve(undefined),
  data: () => ({
    Status: "Disabled: points service unavailable",
    Rank: 0,
    "Total Participants": 0,
    Points: 0,
  }),
  total: () => 0,
  rank: () => 0,
  claimable: () => false,
  // Retain September 9, 2026 at 00:00 UTC as the requested deprecation date.
  deprecated: () => ({ Points: 1788912000 }),
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<undefined>;

/*
ARCHIVED IMPLEMENTATION — DISABLED, NOT EXECUTABLE
Preserved for review and possible reactivation. Verify the points API and
accrual before restoring; resumed trading alone does not establish either.
Replace the disabled export above and review the deprecation date when restoring.

import type { AdapterExport } from "../utils/adapter.ts";

const API_URL = "https://points-api.hypersurface.io/points/{address}/state/";

type API_RESPONSE = {
  rank: {
    place: number;
    total: number;
  };
  state: {
    value: number;
  };
};

export default {
  fetch: async (address: string) => {
    const res = await fetch(API_URL.replace("{address}", address), {
      headers: { "User-Agent": "Checkpoint API (https://checkpoint.exchange)" },
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch hypersurface data ${await res.text()}`);
    }
    const data = await res.json();
    if (data.rank == null || data.state == null) {
      return {
        rank: {
          place: 0,
          total: 0,
        },
        state: {
          value: 0,
        },
      };
    }
    return data;
  },
  data: (data: API_RESPONSE) => ({
    Rank: data.rank.place,
    "Total Participants": data.rank.total,
    Points: data.state.value,
  }),
  total: (data: API_RESPONSE) => data.state.value,
  rank: (data: API_RESPONSE) => data.rank.place,
  // Deprecated effective September 9, 2026, per the supplied cutoff date.
  // Use 00:00 UTC as a date-only marker; historical balance queries stay enabled.
  // Review for reinstatement once the points service and accrual are verified.
  deprecated: () => ({ Points: 1788912000 }),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
*/
