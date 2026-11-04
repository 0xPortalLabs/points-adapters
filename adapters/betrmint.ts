// Disabled 2026-11-04 at the developer's request to stop backend calls.
// Keep this module network-free, including imports and CORS probes.
// Reactivation requires the developer's permission and explicit approval.
// Zero values are disabled placeholders, not verified wallet balances.
import type { AdapterExport } from "../utils/adapter.ts";

export default {
  fetch: () => Promise.resolve(undefined),
  data: () => ({
    Karma: {
      Status: "Disabled at the developer's request",
      Points: 0,
    },
  }),
  total: () => ({ Karma: 0 }),
  rank: () => 0,
  claimable: () => false,
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<undefined>;

/*
ARCHIVED IMPLEMENTATION — DISABLED, NOT EXECUTABLE
Preserved for reference only. Do not restore requests without permission.
Its top-level CORS helper can send requests on import. Any approved restoration
must replace the disabled export above and review monitoring/config.json's
disabledAdapters entry.

import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://betrmint.fun/leaderboard/{address}"
);

type BetrmintData = {
  position: number;
  score: number | null;
  streak?: number;
  staker?: boolean;
  believer?: boolean;
};

export default {
  fetch: async (address: string) => {
    // The API accepts this UA, but rejects "Checkpoint API (...)".
    const res = await fetch(
      API_URL.replace("{address}", address.toLowerCase()),
      {
        headers: {
          "User-Agent": "CheckpointAPI/1.0 (+https://checkpoint.exchange)",
        },
      }
    );
    if (!res.ok) {
      throw new Error(`Betrmint API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return data;
  },
  data: (data: BetrmintData) => ({
    Karma: {
      Points: data.score ?? 0,
      Position: data.position,
      Streak: data.streak ?? 0,
      Staker: data.staker ? "Yes" : "No",
      Believer: data.believer ? "Yes" : "No",
    },
  }),
  total: (data: BetrmintData) => ({
    Karma: data.score ?? 0,
  }),
  rank: (data: BetrmintData) => (data.position > 0 ? data.position : 0),
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<BetrmintData>;
*/
