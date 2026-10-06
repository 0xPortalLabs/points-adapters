import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";

// Pin Season 2: future seasons must use separate points labels.
// Direct requests work from Checkpoint's browser origin; no proxy is needed.
const API_URL = "https://api-v2.kittenswap.finance/s2/user/";

type KittenSwapData = { points: number; tier: string };

export default {
  fetch: async (address: string): Promise<KittenSwapData> => {
    const wallet = getAddress(address).toLowerCase();
    let res: Response;
    try {
      res = await fetch(API_URL + wallet, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10000),
      });
    } catch (error) {
      throw new Error(
        "KittenSwap points request failed before receiving a response",
        { cause: error },
      );
    }
    if (!res.ok) {
      throw new Error(
        `KittenSwap points request failed with status ${res.status}`,
      );
    }
    const response: unknown = await res.json().catch((error: unknown) => {
      throw new Error("Failed to read or parse KittenSwap points response", {
        cause: error,
      });
    });
    if (!response || typeof response !== "object" || Array.isArray(response)) {
      throw new Error("KittenSwap response has invalid points data");
    }
    const data = response as Record<string, unknown>;
    // Verified unknown wallets return exactly this unregistered-user response.
    // Do not interpret arbitrary missing fields or upstream errors as zero.
    if (
      Object.keys(data).length === 2 && data.latestPoints === 0 &&
      data.rank === "none"
    ) {
      return { points: 0, tier: "none" };
    }
    if (
      typeof data.address !== "string" ||
      data.address.toLowerCase() !== wallet
    ) {
      throw new Error("KittenSwap response returned a different wallet");
    }
    if (
      typeof data.points !== "number" || !Number.isFinite(data.points) ||
      data.points < 0 || data.points > Number.MAX_SAFE_INTEGER
    ) {
      throw new Error("KittenSwap response has invalid points");
    }
    if (typeof data.rank !== "string" || !data.rank.trim()) {
      throw new Error("KittenSwap response has invalid tier");
    }
    // The app displays points, not latestPoints. Do not add referral bonuses
    // separately. The API's rank is a tier (e.g. bronze), not a numeric position.
    return { points: data.points, tier: data.rank };
  },
  data: (data: KittenSwapData) => ({
    "Season 2 KittenSwap Points": { Total: data.points, Tier: data.tier },
  }),
  total: (data: KittenSwapData) => ({
    "Season 2 KittenSwap Points": data.points,
  }),
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<KittenSwapData>;
