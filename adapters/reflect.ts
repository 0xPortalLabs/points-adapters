import type { AdapterExport } from "../utils/adapter.ts";
import { isSvmAddress } from "../utils/address.ts";

// The current tranches app uses this public wallet endpoint directly.
// Browser requests from Checkpoint work without a CORS proxy or credentials.
const API_URL = "https://prod.api.reflect.money/points/user/";

type ReflectData = { points: number; rank: number };

const getObject = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Reflect response has invalid points data");
  }
  return value as Record<string, unknown>;
};

const getInteger = (value: unknown, field: string): number => {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`Reflect response has invalid ${field}`);
  }
  return value;
};

export default {
  fetch: async (address: string): Promise<ReflectData> => {
    if (!isSvmAddress(address)) {
      throw new Error("Reflect requires a Solana wallet address");
    }
    let res: Response;
    try {
      res = await fetch(API_URL + encodeURIComponent(address), {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
      });
    } catch (error) {
      throw new Error(
        "Reflect points request failed before receiving a response",
        {
          cause: error,
        },
      );
    }
    if (!res.ok) {
      throw new Error(
        `Reflect points request failed with status ${res.status}`,
      );
    }

    const response = getObject(
      await res.json().catch((error: unknown) => {
        throw new Error("Failed to read or parse Reflect points response", {
          cause: error,
        });
      }),
    );
    if (response.success !== true) {
      throw new Error("Reflect points request was unsuccessful");
    }
    const data = getObject(response.data);
    // Solana wallet addresses are case-sensitive; do not normalize them.
    if (data.address !== address) {
      throw new Error("Reflect response returned a different wallet");
    }
    // Match the tranches app: raw RP has three decimals, rounded down for display.
    // This is the shared RP total, not a season- or tranche-specific balance.
    // Do not add campaignPoints or apply advertised multipliers again.
    // RP is distinct from the recovery program's Reflect Credits (RC).
    const points = Math.floor(getInteger(data.points, "points") / 1000);
    // Unknown wallets return zero points with a synthetic last-place rank.
    const rank = points === 0 ? 0 : getInteger(data.rank, "rank");
    if (points > 0 && rank === 0) {
      throw new Error("Reflect response has invalid rank");
    }
    return { points, rank };
  },
  data: (data: ReflectData) => ({ "Reflect Points": { Total: data.points } }),
  total: (data: ReflectData) => ({ "Reflect Points": data.points }),
  rank: (data: ReflectData) => data.rank,
  supportedAddressTypes: ["svm"],
} satisfies AdapterExport<ReflectData>;
