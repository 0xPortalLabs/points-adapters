import { formatUnits, getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";

const API_URL = "https://api.merkl.xyz/v4/rewards/token/total";
const CHAIN_ID = "57073";
const POINTS_TOKEN = "0x40aBd730Cc9dA34a8EE9823fEaBDBa35E50c4ac7";

type TydroData = { points: number };

export default {
  fetch: async (address: string): Promise<TydroData> => {
    const wallet = getAddress(address).toLowerCase();
    const params = new URLSearchParams({
      chainId: CHAIN_ID,
      address: POINTS_TOKEN,
      recipient: wallet,
    });
    // Tydro's frontend uses this wallet-scoped endpoint. Direct browser fetches
    // from Checkpoint work without authentication or a CORS proxy.
    let res: Response;
    try {
      res = await fetch(`${API_URL}?${params}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10000),
      });
    } catch (error) {
      throw new Error(
        "Tydro points request failed before receiving a response",
        { cause: error },
      );
    }
    if (!res.ok) {
      throw new Error(`Tydro points request failed with status ${res.status}`);
    }

    const response: unknown = await res.json().catch((error: unknown) => {
      throw new Error("Failed to read or parse Tydro points response", {
        cause: error,
      });
    });
    if (!response || typeof response !== "object" || Array.isArray(response)) {
      throw new Error("Tydro response has invalid points data");
    }
    const data = response as Record<string, unknown>;
    if (
      typeof data.rewardTokenId !== "string" ||
      data.rewardTokenId.toLowerCase() !==
        `${CHAIN_ID}-${POINTS_TOKEN}`.toLowerCase()
    ) {
      throw new Error("Tydro response returned a different points program");
    }
    if (typeof data.amount !== "string" || !/^\d+$/.test(data.amount)) {
      throw new Error("Tydro response has invalid points");
    }
    const points = Number(formatUnits(BigInt(data.amount), 18));
    if (!Number.isFinite(points)) {
      throw new Error("Tydro response has invalid points");
    }
    // Match the app's cumulative earned total, not a season-specific balance
    // or token holdings. Claimed points remain included; do not subtract them
    // or apply Season 2 boosts again. Unknown wallets return amount: "0".
    return { points };
  },
  data: (data: TydroData) => ({ "TydroInkPoints": { Total: data.points } }),
  total: (data: TydroData) => ({ "TydroInkPoints": data.points }),
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<TydroData>;
