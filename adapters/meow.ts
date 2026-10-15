import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { wrapCORSProxy } from "../utils/cors.ts";

const API_URL = "https://meow.exchange/points/wallet?address=";

type MeowData = { points: number; rank: number };

export default {
  fetch: async (address: string): Promise<MeowData> => {
    const wallet = getAddress(address).toLowerCase();
    const url = API_URL + wallet;
    // Meow blocks cross-origin browser reads. Proxy only in browsers, without
    // an extra CORS probe; backend requests remain direct.
    const requestUrl = "document" in globalThis ? wrapCORSProxy(url) : url;
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
