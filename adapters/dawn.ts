import type { AdapterExport } from "../utils/adapter.ts";
import { isSvmAddress } from "../utils/address.ts";
import { wrapCORSProxy } from "../utils/cors.ts";

const API_URL = "https://api.infrastructure.finance/points/";
// Pin the season so a future rollover cannot silently replace this balance.
// This is USD.infra Bytes, not DAWN's separate Validator Extension rewards.
const SEASON = 1;
const LABEL = `Season ${SEASON} Bytes`;

type DawnData = { points: number };

const getObject = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("DAWN response has invalid points data");
  }
  return value as Record<string, unknown>;
};

export default {
  fetch: async (address: string): Promise<DawnData> => {
    if (!isSvmAddress(address)) {
      throw new Error("DAWN requires a Solana wallet address");
    }
    // Solana addresses are case-sensitive. Never lowercase the wallet.
    const url = `${API_URL}${encodeURIComponent(address)}?season=${SEASON}`;
    // Checkpoint's browser origin is blocked by CORS; backend calls stay direct.
    const requestUrl = "document" in globalThis ? wrapCORSProxy(url) : url;
    let res: Response;
    try {
      res = await fetch(requestUrl, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10000),
      });
    } catch (error) {
      throw new Error("DAWN Bytes request failed before receiving a response", {
        cause: error,
      });
    }
    if (!res.ok) {
      throw new Error(`DAWN Bytes request failed with status ${res.status}`);
    }

    const response = getObject(
      await res.json().catch((error: unknown) => {
        throw new Error("Failed to read or parse DAWN Bytes response", {
          cause: error,
        });
      }),
    );
    const summary = getObject(response.summary);
    const season = getObject(response.season);
    if (summary.user_wallet !== address) {
      throw new Error("DAWN response returned a different wallet");
    }
    if (
      season.number !== SEASON || typeof season.id !== "string" ||
      !season.id.trim() || summary.season_id !== season.id
    ) {
      throw new Error("DAWN response returned a different points season");
    }
    const points = summary.total_points;
    if (
      typeof points !== "number" || !Number.isFinite(points) || points < 0 ||
      points > Number.MAX_SAFE_INTEGER
    ) {
      throw new Error("DAWN response has invalid Bytes");
    }
    // Matches the app's displayed balance: already human-readable and boosted.
    // Verified no-points wallets return HTTP 200 with total_points: 0.
    // Do not apply current_epoch.multiplier again or expose estimated_tokens
    // as claimable rewards. Rank would require a separate leaderboard scan.
    return { points };
  },
  data: (data: DawnData) => ({ [LABEL]: { Total: data.points } }),
  total: (data: DawnData) => ({ [LABEL]: data.points }),
  supportedAddressTypes: ["svm"],
} satisfies AdapterExport<DawnData>;
