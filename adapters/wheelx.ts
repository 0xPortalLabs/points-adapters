import type { AdapterExport } from "../utils/adapter.ts";

// Disabled as a precaution following a reported security incident; cause unverified.
// Keep this module network-free, including at import time. Do not restore
// WheelX requests without an explicit review and approval.
export default {
  fetch: () => Promise.resolve(undefined),
  data: () => ({
    Status: "Disabled pending security review",
    "Total XP": 0,
    "Available XP": 0,
    "Redeemed XP": 0,
    "Consumed XP": 0,
    "Referral XP": 0,
    "Other XP": 0,
    "Trade XP": 0,
    "Deploy XP": 0,
    "GM XP": 0,
    Multiplier: 0,
  }),
  total: () => 0,
  rank: () => 0,
  claimable: () => false,
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<undefined>;

/*
ARCHIVED IMPLEMENTATION — DISABLED, NOT EXECUTABLE
Preserved for review only. Reactivation requires explicit security review and
approval. Replace the disabled export above before restoring this implementation;
its top-level CORS helper can make requests as soon as the module is imported.

import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://api.wheelx.fi/v1/points/info?address={address}",
);

type WheelXResponse = {
  total: string;
  redeemed: string;
  redeemable: string;
  trade_points: string;
  referrer_points: string;
  deploy_points: string;
  gm_points: string;
  other_points: string;
  consumed_points: string;
  multiplier: string;
  rank: number | null;
  withdraw_enabled: boolean;
};

const getNumber = (value: unknown, field: string): number => {
  if (
    (typeof value !== "string" && typeof value !== "number") ||
    (typeof value === "string" && !value.trim())
  ) {
    throw new Error(`WheelX points response has no ${field}`);
  }

  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`WheelX points response has invalid ${field}`);
  }

  return number;
};

const getRank = (data: WheelXResponse): number | null => {
  if (data.rank === null) return null;

  const rank = getNumber(data.rank, "rank");
  if (!Number.isSafeInteger(rank) || rank < 0) {
    throw new Error("WheelX points response has invalid rank");
  }

  return rank;
};

const isClaimable = (data: WheelXResponse): boolean => {
  if (typeof data.withdraw_enabled !== "boolean") {
    throw new Error("WheelX points response has no withdrawal status");
  }

  return data.withdraw_enabled;
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

    if (!res.ok) {
      throw new Error(`WheelX points request failed with status ${res.status}`);
    }

    return await res.json() as WheelXResponse;
  },
  data: (data: WheelXResponse) => ({
    "Total XP": getNumber(data.total, "total"),
    "Available XP": getNumber(data.redeemable, "redeemable"),
    "Redeemed XP": getNumber(data.redeemed, "redeemed"),
    "Consumed XP": getNumber(data.consumed_points, "consumed points"),
    "Referral XP": getNumber(data.referrer_points, "referrer points"),
    "Other XP": getNumber(data.other_points, "other points"),
    "Trade XP": getNumber(data.trade_points, "trade points"),
    "Deploy XP": getNumber(data.deploy_points, "deploy points"),
    "GM XP": getNumber(data.gm_points, "GM points"),
    Multiplier: getNumber(data.multiplier, "multiplier"),
  }),
  total: (data: WheelXResponse) => getNumber(data.total, "total"),
  rank: getRank,
  claimable: isClaimable,
  supportedAddressTypes: ["evm"],
} as AdapterExport<WheelXResponse>;
*/
