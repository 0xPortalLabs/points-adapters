import { formatUnits, getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";

// Mezzanine's public API allows direct browser requests; no CORS proxy is needed.
// The separate user field resolves any wallet, including those outside page 1.
// Limit the unused leaderboard rows to one; do not paginate or sum them.
const API_URL =
  "https://mezz-api-prod.woof.software/api/points/leaderboard?page=1&limit=1&address=";

type MezzanineData = { points: number; rank: number };

export default {
  fetch: async (address: string): Promise<MezzanineData> => {
    const wallet = getAddress(address).toLowerCase();
    let res: Response;
    try {
      res = await fetch(API_URL + wallet, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10000),
      });
    } catch (error) {
      throw new Error(
        "Mezzanine points request failed before receiving a response",
        { cause: error },
      );
    }
    if (!res.ok) {
      throw new Error(
        `Mezzanine points request failed with status ${res.status}`,
      );
    }

    const response: unknown = await res.json().catch((error: unknown) => {
      throw new Error("Failed to read or parse Mezzanine points response", {
        cause: error,
      });
    });
    if (!response || typeof response !== "object" || Array.isArray(response)) {
      throw new Error("Mezzanine response has invalid points data");
    }
    const user = (response as Record<string, unknown>).user;
    if (!user || typeof user !== "object" || Array.isArray(user)) {
      throw new Error("Mezzanine response has invalid wallet data");
    }
    const data = user as Record<string, unknown>;
    if (
      typeof data.address !== "string" || data.address.toLowerCase() !== wallet
    ) {
      throw new Error("Mezzanine response returned a different wallet");
    }
    if (
      typeof data.totalPoints !== "string" || !/^\d+$/.test(data.totalPoints)
    ) {
      throw new Error("Mezzanine response has invalid points");
    }
    // Match the app's 18-decimal conversion of user.totalPoints, not the
    // top-level totalPoints (the entire program's total). No extra boosts.
    const rawPoints = BigInt(data.totalPoints);
    if (rawPoints > BigInt(Number.MAX_SAFE_INTEGER) * 10n ** 18n) {
      throw new Error("Mezzanine response has invalid points");
    }
    const points = Number(formatUnits(rawPoints, 18));
    if (!Number.isFinite(points)) {
      throw new Error("Mezzanine response has invalid points");
    }
    // Unknown wallets explicitly return zero points and null rank. Missing
    // users, HTTP failures, and malformed responses must not become zeros.
    const rank = data.rank === null && points === 0 ? 0 : data.rank;
    if (
      typeof rank !== "number" || !Number.isSafeInteger(rank) ||
      rank < (points > 0 ? 1 : 0)
    ) {
      throw new Error("Mezzanine response has invalid rank");
    }
    return { points, rank };
  },
  data: (data: MezzanineData) => ({
    Mezzies: { Total: data.points },
  }),
  total: (data: MezzanineData) => ({ Mezzies: data.points }),
  rank: (data: MezzanineData) => data.rank,
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<MezzanineData>;
