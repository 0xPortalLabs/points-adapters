// Disabled 2026-10-27 after Meow changed its points API architecture.
// The public /points/wallet endpoint returns 404; the replacement /api/points
// requires session/access authorization and is not a public wallet lookup.
// This deprecates the integration, not the points program. Keep network-free
// until a public wallet-scoped endpoint is verified and reactivation approved.
// Zero values below are disabled placeholders, not verified wallet balances.
import type { AdapterExport } from "../utils/adapter.ts";

export default {
  fetch: () => Promise.resolve(undefined),
  data: () => ({
    "Meow Points": {
      Status: "Disabled: public wallet points endpoint unavailable",
      Total: 0,
    },
  }),
  total: () => ({ "Meow Points": 0 }),
  rank: () => 0,
  claimable: () => false,
  // Integration deprecated October 27, 2026 at 00:00 UTC.
  deprecated: () => ({ "Meow Points": 1793059200 }),
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<undefined>;

/*
ARCHIVED IMPLEMENTATION — DISABLED, NOT EXECUTABLE
Preserved for possible reactivation. Verify public wallet lookup, app totals,
and browser access before restoring. Replace the disabled export above and
review the deprecation date; do not simply uncomment this block.

import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { wrapCORSProxy } from "../utils/cors.ts";

const API_URL = "https://meow.exchange/points/wallet?address=";

type MeowData = { points: number; rank: number };

export default {
  fetch: async (address: string): Promise<MeowData> => {
    const wallet = getAddress(address).toLowerCase();
    const url = API_URL + wallet;
    // Meow blocks cross-origin reads in pages and browser workers. The latter
    // expose importScripts (including module workers), but have no document.
    // Avoid an extra CORS probe; backend requests remain direct.
    const isBrowser = "document" in globalThis ||
      typeof Reflect.get(globalThis, "importScripts") === "function";
    const requestUrl = isBrowser ? wrapCORSProxy(url) : url;
    let res: Response;
    try {
      res = await fetch(requestUrl, {
        headers: { Accept: "application/json" },
        credentials: "omit",
        signal: AbortSignal.timeout(10000),
      });
    } catch (error) {
      throw new Error(
        "Meow points request failed before receiving a response",
        { cause: error },
      );
    }
    if (!res.ok) {
      throw new Error(`Meow points request failed with status ${res.status}`);
    }
    const response: unknown = await res.json().catch((error: unknown) => {
      throw new Error("Failed to read or parse Meow points response", {
        cause: error,
      });
    });
    if (!response || typeof response !== "object" || Array.isArray(response)) {
      throw new Error("Meow response has invalid points data");
    }
    const data = response as Record<string, unknown>;
    if (
      typeof data.wallet !== "string" || data.wallet.toLowerCase() !== wallet
    ) {
      throw new Error("Meow response returned a different wallet");
    }
    if (
      typeof data.points !== "number" || !Number.isFinite(data.points) ||
      data.points < 0 || data.points > Number.MAX_SAFE_INTEGER
    ) {
      throw new Error("Meow response has invalid points");
    }
    // Unknown wallets return zero points and null rank, not an HTTP error.
    // A ranked wallet may still have zero points, so retain valid numeric ranks.
    const rank = data.rank === null && data.points === 0 ? 0 : data.rank;
    if (
      typeof rank !== "number" || !Number.isSafeInteger(rank) || rank < 0 ||
      (rank === 0 && data.rank !== null)
    ) {
      throw new Error("Meow response has invalid rank");
    }
    // Match the app's supplied points, including decimals; do not calculate
    // them from USD volume. This endpoint currently has no season selector.
    return { points: data.points, rank };
  },
  data: (data: MeowData) => ({ "Meow Points": { Total: data.points } }),
  total: (data: MeowData) => ({ "Meow Points": data.points }),
  rank: (data: MeowData) => data.rank,
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<MeowData>;
*/
