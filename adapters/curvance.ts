import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";

// Server-side wallet filtering: one row, with its global rank. No CORS proxy needed.
const API_URL =
  "https://api2.curvance.com/bytes/leaderboard?page=1&pageCount=1&queryAddress={address}";

type CurvanceData = {
  bytes: number;
  rank: number;
};

export default {
  fetch: async (address: string): Promise<CurvanceData> => {
    const normalizedAddress = getAddress(address).toLowerCase();
    let res: Response;
    try {
      res = await fetch(API_URL.replace("{address}", normalizedAddress), {
        headers: { Accept: "application/json" },
      });
    } catch (error) {
      throw new Error(
        "Curvance Bytes request failed before receiving a response",
        { cause: error },
      );
    }

    if (!res.ok) {
      throw new Error(
        `Curvance Bytes request failed with status ${res.status}`,
      );
    }

    const response: unknown = await res.json();
    if (!response || typeof response !== "object") {
      throw new Error("Curvance response has invalid data");
    }

    const data = response as Record<string, unknown>;
    if (!Array.isArray(data.leaderboard)) {
      throw new Error("Curvance response has no leaderboard data");
    }
    if (data.leaderboard.length === 0 && data.totalCount === 0) {
      return { bytes: 0, rank: 0 };
    }
    if (data.leaderboard.length !== 1 || data.totalCount !== 1) {
      throw new Error("Curvance response has unexpected wallet count");
    }

    const entry: unknown = data.leaderboard[0];
    if (!entry || typeof entry !== "object") {
      throw new Error("Curvance response has invalid wallet data");
    }
    const wallet = entry as Record<string, unknown>;
    if (
      typeof wallet.wallet_address !== "string" ||
      wallet.wallet_address.toLowerCase() !== normalizedAddress
    ) {
      throw new Error("Curvance response returned a different wallet");
    }
    if (
      typeof wallet.total_bytes !== "number" ||
      !Number.isFinite(wallet.total_bytes) || wallet.total_bytes < 0
    ) {
      throw new Error("Curvance response has invalid Bytes");
    }
    if (
      typeof wallet.rank !== "number" ||
      !Number.isSafeInteger(wallet.rank) || wallet.rank < 1
    ) {
      throw new Error("Curvance response has invalid rank");
    }

    // Public leaderboard balance; the authenticated dashboard may update separately.
    return { bytes: wallet.total_bytes, rank: wallet.rank };
  },
  data: (data: CurvanceData) => ({ Bytes: { Total: data.bytes } }),
  total: (data: CurvanceData) => ({ Bytes: data.bytes }),
  rank: (data: CurvanceData) => data.rank,
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<CurvanceData>;
