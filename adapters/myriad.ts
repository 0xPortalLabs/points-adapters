import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";

// Public wallet-scoped API; direct browser requests work without a CORS proxy.
const API_URL =
  "https://api.myriad.markets/api/leaderboard/GetProfilePointsSummary?address={address}";
const NO_POINTS_MESSAGE =
  "Cannot get the value of a token type 'Null' as a number.";

type MyriadData = {
  points: number;
  rank: number;
};

export default {
  fetch: async (address: string): Promise<MyriadData> => {
    const normalizedAddress = getAddress(address).toLowerCase();
    let res: Response;
    try {
      res = await fetch(API_URL.replace("{address}", normalizedAddress), {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(5000),
      });
    } catch (error) {
      throw new Error(
        "Myriad points request failed before receiving a response",
        { cause: error },
      );
    }

    if (res.status === 400) {
      const error: unknown = await res.json();
      // Verified against three zero-point leaderboard accounts and unknown wallets.
      // Only this exact upstream error denotes no points; other failures must surface.
      if (
        error && typeof error === "object" &&
        (error as Record<string, unknown>).Message === NO_POINTS_MESSAGE
      ) {
        return { points: 0, rank: 0 };
      }
    }
    if (!res.ok) {
      throw new Error(`Myriad points request failed with status ${res.status}`);
    }

    const response: unknown = await res.json();
    if (!response || typeof response !== "object" || Array.isArray(response)) {
      throw new Error("Myriad response has invalid data");
    }

    const data = response as Record<string, unknown>;
    if (
      typeof data.address !== "string" ||
      data.address.toLowerCase() !== normalizedAddress
    ) {
      throw new Error("Myriad response returned a different wallet");
    }
    if (
      typeof data.totalPoints !== "number" ||
      !Number.isFinite(data.totalPoints) || data.totalPoints < 0
    ) {
      throw new Error("Myriad response has invalid points");
    }
    if (
      typeof data.rank !== "number" || !Number.isSafeInteger(data.rank) ||
      data.rank < (data.totalPoints > 0 ? 1 : 0)
    ) {
      throw new Error("Myriad response has invalid rank");
    }

    // Season 3 cumulative MYR Points, not spendable PTS or a sum of weekly history.
    // The API resolves linked Myriad wallets; do not sum totals across linked addresses.
    return {
      points: data.totalPoints,
      rank: data.totalPoints === 0 ? 0 : data.rank,
    };
  },
  data: (data: MyriadData) => ({ "MYR Points": { Total: data.points } }),
  total: (data: MyriadData) => ({ "MYR Points": data.points }),
  rank: (data: MyriadData) => data.rank,
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<MyriadData>;
