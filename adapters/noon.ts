import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";

const API_URL = "https://back.noon.capital/api/v1/points/{address}";
const FIRST_API_SEASON_MONTH = 2025 * 12 + 5; // API bucket 1: June 2025

type NoonSeason = {
  total?: unknown;
};

type NoonProtocol = {
  bySeasons?: Record<string, NoonSeason>;
};

type NoonResponse = {
  byChain?: Record<
    string,
    { byProtocol?: Record<string, NoonProtocol> }
  >;
};

const getCurrentSeason = (): string => {
  const now = new Date();
  const currentMonth = now.getUTCFullYear() * 12 + now.getUTCMonth();
  return String(currentMonth - FIRST_API_SEASON_MONTH + 1);
};

const getPoints = (data: NoonResponse | undefined): number => {
  if (!data) return 0;
  if (!data.byChain || typeof data.byChain !== "object") {
    throw new Error("Noon response has invalid chain data");
  }

  const protocols = Object.values(data.byChain).flatMap((chain) => {
    if (!chain?.byProtocol || typeof chain.byProtocol !== "object") {
      throw new Error("Noon response has invalid protocol data");
    }

    return Object.values(chain.byProtocol);
  });
  if (!protocols.length) return 0;

  const currentSeason = getCurrentSeason();
  return protocols.reduce((total, protocol) => {
    if (!protocol?.bySeasons || typeof protocol.bySeasons !== "object") {
      throw new Error("Noon response has invalid season data");
    }

    const season = protocol.bySeasons?.[currentSeason];
    if (!season) return total;

    const value = season.total;
    if (
      (typeof value !== "number" && typeof value !== "string") ||
      (typeof value === "string" && !value.trim())
    ) {
      throw new Error("Noon response has no season total");
    }

    const points = Number(value);
    if (!Number.isFinite(points) || points < 0) {
      throw new Error("Noon response has invalid season total");
    }

    return total + points;
  }, 0);
};

export default {
  fetch: async (address: string) => {
    const normalizedAddress = getAddress(address).toLowerCase();
    const res = await fetch(
      API_URL.replace("{address}", normalizedAddress),
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
        },
      },
    );

    if (res.status === 404) return undefined;
    if (!res.ok) {
      throw new Error(`Noon request failed with status ${res.status}`);
    }

    const data = await res.json();
    if (!data || typeof data !== "object") {
      throw new Error("Noon response has invalid data");
    }

    return data as NoonResponse;
  },
  data: (data: NoonResponse | undefined) => ({
    "Current Season Points": getPoints(data),
  }),
  total: getPoints,
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<NoonResponse | undefined>;
