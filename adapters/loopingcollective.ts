// Disabled 2026-10-10 as a precaution pending security review: the Looping
// Collective app was reported to contact api.enso.finance, which was flagged
// by security software. This adapter queries Looping's points API, not Enso;
// the alert does not establish a compromise. Keep this module network-free
// until the dependency has been reviewed and reactivation explicitly approved.
import type { AdapterExport } from "../utils/adapter.ts";

export default {
  fetch: () => Promise.resolve(undefined),
  data: () => ({
    "Phase 3 LOOP Points": {
      Status: "Disabled pending security review",
      Total: 0,
    },
  }),
  total: () => ({ "Phase 3 LOOP Points": 0 }),
  rank: () => 0,
  claimable: () => false,
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<undefined>;

/*
ARCHIVED IMPLEMENTATION — DISABLED, NOT EXECUTABLE
Preserved for review only. Reactivation requires explicit security review and
approval. Replace the disabled export above before restoring this implementation.

import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { wrapCORSProxy } from "../utils/cors.ts";

const API_URL = "https://app.loopingcollective.org/api/points";
// Pin Phase 3 so a rollover cannot replace this points series with a new one.
// Future phases need separate labels; deprecate Phase 3 once its end is verified.
const PHASE_ID = "ac939046-ba23-4860-8575-124943a1343d";

type LoopingCollectiveData = { points: number; rank: number };

const getObject = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Looping Collective response has invalid data");
  }
  return value as Record<string, unknown>;
};

export default {
  fetch: async (address: string): Promise<LoopingCollectiveData> => {
    const wallet = getAddress(address).toLowerCase();
    // Checkpoint's browser origin is blocked by CORS; server requests stay direct.
    const requestUrl = "document" in globalThis
      ? wrapCORSProxy(API_URL)
      : API_URL;
    let res: Response;
    try {
      res = await fetch(requestUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address: wallet, phaseId: PHASE_ID }),
        signal: AbortSignal.timeout(10000),
      });
    } catch (error) {
      throw new Error(
        "Looping Collective points request failed before receiving a response",
        { cause: error },
      );
    }
    if (!res.ok) {
      if (res.status === 404) {
        const error: unknown = await res.json().catch(() => null);
        // Only this verified missing-wallet response represents a zero balance.
        if (
          error && typeof error === "object" && !Array.isArray(error) &&
          "success" in error && error.success === false &&
          "message" in error && error.message === "User not found in this phase"
        ) {
          return { points: 0, rank: 0 };
        }
      }
      throw new Error(
        `Looping Collective points request failed with status ${res.status}`,
      );
    }
    const response = getObject(
      await res.json().catch((error: unknown) => {
        throw new Error("Failed to read or parse Looping Collective response", {
          cause: error,
        });
      }),
    );
    if (response.success !== true) {
      throw new Error(
        "Looping Collective response reports an unsuccessful query",
      );
    }
    const result = getObject(response.result);

    if (
      typeof result.totalPoints !== "string" ||
      !/^\d+(\.\d+)?$/.test(result.totalPoints)
    ) {
      throw new Error("Looping Collective response has invalid total points");
    }
    const points = Number(result.totalPoints);
    if (!Number.isFinite(points) || points > Number.MAX_SAFE_INTEGER) {
      throw new Error("Looping Collective response has invalid total points");
    }
    const rank = points === 0 ? 0 : result.rank;
    if (
      typeof rank !== "number" || !Number.isSafeInteger(rank) || rank < 0 ||
      (points > 0 && rank === 0)
    ) {
      throw new Error("Looping Collective response has invalid rank");
    }
    // Match the app's totalPoints, already in human-readable decimals. Do not
    // reapply multipliers or add referralPoints, totalTogether or partner points.
    return { points, rank };
  },
  data: (data: LoopingCollectiveData) => ({
    "Phase 3 LOOP Points": { Total: data.points },
  }),
  total: (data: LoopingCollectiveData) => ({
    "Phase 3 LOOP Points": data.points,
  }),
  rank: (data: LoopingCollectiveData) => data.rank,
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<LoopingCollectiveData>;
*/
