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
