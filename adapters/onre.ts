import type { AdapterExport } from "../utils/adapter.ts";
import { isSvmAddress } from "../utils/address.ts";
import { wrapCORSProxy } from "../utils/cors.ts";

const API_URL = "https://rewards.api.onre.finance/api/v1/points/";

type OnReData = {
  points: number;
  rank: number;
};

const getInteger = (value: unknown, field: string): number => {
  if (
    typeof value !== "number" || !Number.isSafeInteger(value) || value < 0
  ) {
    throw new Error(`OnRe response has invalid ${field}`);
  }
  return value;
};

export default {
  fetch: async (address: string): Promise<OnReData> => {
    if (!isSvmAddress(address)) {
      throw new Error("OnRe requires a Solana wallet address");
    }
    // The live app uses /points/{address}, not the documented /points/wallet/ route.
    const url = API_URL + encodeURIComponent(address);
    // OnRe blocks Checkpoint's browser origin. Keep server requests direct
    // and avoid an extra CORS probe for every wallet lookup.
    const requestUrl = "document" in globalThis ? wrapCORSProxy(url) : url;
    let res: Response;
    try {
      res = await fetch(requestUrl, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10000),
      });
    } catch (error) {
      throw new Error(
        "OnRe points request failed before receiving a response",
        {
          cause: error,
        },
      );
    }
    if (!res.ok) {
      throw new Error(`OnRe points request failed with status ${res.status}`);
    }

    const response: unknown = await res.json().catch((error: unknown) => {
      throw new Error("OnRe points response is not valid JSON", {
        cause: error,
      });
    });
    if (!response || typeof response !== "object" || Array.isArray(response)) {
      throw new Error("OnRe response has invalid points data");
    }
    const data = response as Record<string, unknown>;
    if (data.address !== address) {
      throw new Error("OnRe response returned a different wallet");
    }
    // totalPoints already includes all venues and referral bonuses. These are
    // OnRe points, not each integrated venue's own rewards; do not sum them again.
    const points = getInteger(data.totalPoints, "total points");
    // Unknown wallets return HTTP 200 with zero points and a synthetic last rank.
    // Do not expose that rank or turn HTTP/validation failures into zero balances.
    const rank = points === 0 ? 0 : getInteger(data.rank, "rank");
    if (points > 0 && rank === 0) {
      throw new Error("OnRe response has invalid rank");
    }
    return { points, rank };
  },
  data: (data: OnReData) => ({ "OnRe Points": { Total: data.points } }),
  total: (data: OnReData) => ({ "OnRe Points": data.points }),
  rank: (data: OnReData) => data.rank,
  supportedAddressTypes: ["svm"],
} satisfies AdapterExport<OnReData>;
