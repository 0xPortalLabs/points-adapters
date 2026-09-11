import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";

const API_URL = "https://dna.zerion.io/api/v1/leaders/{address}";

type ZerionEntry = {
  wallet?: unknown;
  earnedXP?: unknown;
  level?: unknown;
  position?: unknown;
};

const getNumber = (
  entry: ZerionEntry | undefined,
  field: "earnedXP" | "level" | "position",
): number => {
  if (!entry) return 0;

  const value = entry[field];
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`Zerion response has invalid ${field}`);
  }
  if (
    field !== "earnedXP" &&
    (!Number.isInteger(value) || (field === "position" && value === 0))
  ) {
    throw new Error(`Zerion response has invalid ${field}`);
  }

  return value;
};

export default {
  fetch: async (address: string) => {
    const normalizedAddress = getAddress(address).toLowerCase();
    const res = await fetch(API_URL.replace("{address}", normalizedAddress), {
      headers: {
        Accept: "application/json",
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
    });

    if (res.status === 404) return undefined;
    if (!res.ok) {
      throw new Error(`Zerion request failed with status ${res.status}`);
    }

    const data = await res.json();
    if (!data || typeof data !== "object") {
      throw new Error("Zerion response has invalid data");
    }

    const entry = data as ZerionEntry;
    if (
      typeof entry.wallet !== "string" ||
      entry.wallet.toLowerCase() !== normalizedAddress
    ) {
      throw new Error("Zerion response returned a different wallet");
    }

    return entry;
  },
  data: (entry: ZerionEntry | undefined) => ({
    XP: {
      Total: getNumber(entry, "earnedXP"),
      Level: getNumber(entry, "level"),
      Rank: getNumber(entry, "position"),
    },
  }),
  total: (entry: ZerionEntry | undefined) => ({
    XP: getNumber(entry, "earnedXP"),
  }),
  rank: (entry: ZerionEntry | undefined) => getNumber(entry, "position"),
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<ZerionEntry | undefined>;
