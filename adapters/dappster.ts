import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://dappster.fun/api/public/points/{address}",
);

type DappsterResponse = {
  protocol: "Dappster";
  address: string;
  addressType: "evm" | "svm";
  points: number;
  rank: number;
  publicApps: number;
  breakdown: Record<string, number>;
  username: string | null;
  profileUrl: string | null;
};

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function parseDappsterResponse(payload: unknown): DappsterResponse {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Dappster API returned a malformed points payload");
  }

  const value = payload as Record<string, unknown>;
  const breakdown = value.breakdown;
  const hasValidBreakdown = breakdown !== null &&
    typeof breakdown === "object" &&
    !Array.isArray(breakdown) &&
    Object.entries(breakdown).every(([chain, points]) =>
      chain.length > 0 && isNonNegativeInteger(points)
    );

  if (
    value.protocol !== "Dappster" ||
    typeof value.address !== "string" ||
    (value.addressType !== "evm" && value.addressType !== "svm") ||
    !isNonNegativeInteger(value.points) ||
    !isNonNegativeInteger(value.rank) ||
    !isNonNegativeInteger(value.publicApps) ||
    !hasValidBreakdown ||
    !(value.username === null || typeof value.username === "string") ||
    !(value.profileUrl === null || typeof value.profileUrl === "string")
  ) {
    throw new Error("Dappster API returned a malformed points payload");
  }

  return value as DappsterResponse;
}

export default {
  fetch: async (address: string) => {
    const response = await fetch(
      API_URL.replace("{address}", encodeURIComponent(address)),
      {
        headers: {
          "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
        },
      },
    );
    if (!response.ok) {
      throw new Error(`Dappster API returned ${response.status}`);
    }
    const payload: unknown = await response.json();
    return parseDappsterResponse(payload);
  },
  data: (response: DappsterResponse) => ({
    "Dappster Points": response.points,
    "Public Marketplace dApps": response.publicApps,
    "Creator": response.username || "Unclaimed public username",
    ...Object.fromEntries(
      Object.entries(response.breakdown).map(([chain, points]) => [
        `${chain} dApps`,
        points,
      ]),
    ),
  }),
  total: (response: DappsterResponse) => response.points,
  rank: (response: DappsterResponse) => response.rank,
  supportedAddressTypes: ["evm", "svm"],
} as AdapterExport<DappsterResponse>;
