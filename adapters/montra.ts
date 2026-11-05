import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";

// Public wallet lookup; direct browser requests work without a CORS proxy.
const API_URL = "https://api.montramarkets.xyz/api/airdrop/wallets/";

type MontraData = { points: number; rank: number };

export default {
  fetch: async (address: string): Promise<MontraData> => {
    const wallet = getAddress(address).toLowerCase();
    let res: Response;
    try {
      res = await fetch(API_URL + wallet, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10000),
      });
    } catch (error) {
      throw new Error(
        "Montra points request failed before receiving a response",
        { cause: error },
      );
    }
    if (!res.ok) {
      throw new Error(`Montra points request failed with status ${res.status}`);
    }

    const response: unknown = await res.json().catch((error: unknown) => {
      throw new Error("Failed to read or parse Montra points response", {
        cause: error,
      });
    });
    if (!response || typeof response !== "object" || Array.isArray(response)) {
      throw new Error("Montra response has invalid points data");
    }
    const data = response as Record<string, unknown>;
    if (typeof data.points !== "string" || !/^\d+$/.test(data.points)) {
      throw new Error("Montra response has invalid points");
    }
    // The app displays points as whole units, not 18-decimal token amounts.
    // This total already includes trading, launching, and levels. Ignore
    // top10.weeks: its MONTRA allocation estimates are not additional points.
    const points = Number(data.points);
    if (!Number.isSafeInteger(points)) {
      throw new Error("Montra response has invalid points");
    }
    // Unknown wallets return explicit zero points and null rank. Never turn
    // missing fields, request failures, or invalid responses into zero balances.
    const rank = data.rank === null && points === 0 ? 0 : data.rank;
    if (
      typeof rank !== "number" || !Number.isSafeInteger(rank) ||
      rank < (points > 0 ? 1 : 0)
    ) {
      throw new Error("Montra response has invalid rank");
    }
    return { points, rank };
  },
  data: (data: MontraData) => ({ "Montra Points": { Total: data.points } }),
  total: (data: MontraData) => ({ "Montra Points": data.points }),
  rank: (data: MontraData) => data.rank,
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<MontraData>;
