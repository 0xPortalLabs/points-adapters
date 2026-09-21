import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://hylo.so/api/xp/stats?address={address}",
);

type HyloData = {
  currentSeasonXp: number;
  allSeasonXp: number;
  xpPerDay: number;
  referralXp: number;
  referrals: number;
  rank: number;
  level: number;
  tier: string;
  crowns: number;
};

const getNumber = (value: unknown, field: string): number => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`Hylo response has invalid ${field}`);
  }

  return value;
};

const getInteger = (value: unknown, field: string): number => {
  const number = getNumber(value, field);
  if (!Number.isInteger(number)) {
    throw new Error(`Hylo response has invalid ${field}`);
  }

  return number;
};

export default {
  fetch: async (address: string): Promise<HyloData> => {
    let res: Response;
    try {
      res = await fetch(
        API_URL.replace("{address}", encodeURIComponent(address)),
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
          },
        },
      );
    } catch (error) {
      throw new Error(
        "Hylo XP request failed before receiving a response",
        { cause: error },
      );
    }

    if (!res.ok) {
      throw new Error(`Hylo XP request failed with status ${res.status}`);
    }

    const response: unknown = await res.json();
    if (!response || typeof response !== "object") {
      throw new Error("Hylo response has invalid data");
    }

    const data = response as Record<string, unknown>;
    const referral = data.referral;
    if (!referral || typeof referral !== "object") {
      throw new Error("Hylo response has invalid referral data");
    }

    const referralData = referral as Record<string, unknown>;
    const currentSeasonXp = getNumber(data.totalXp, "current season XP");
    const allSeasonXp = getNumber(data.allSeasonXp, "all season XP");
    const globalRank = getInteger(data.globalRank, "global rank");
    if (allSeasonXp < currentSeasonXp) {
      throw new Error("Hylo response has invalid all season XP");
    }

    if (typeof data.levelName !== "string" || !data.levelName.trim()) {
      throw new Error("Hylo response has invalid tier");
    }

    return {
      currentSeasonXp,
      allSeasonXp,
      xpPerDay: getNumber(data.xpPerDay, "XP per day"),
      referralXp: getNumber(referralData.earnings, "referral XP"),
      referrals: getInteger(referralData.referralsCount, "referral count"),
      rank: currentSeasonXp === 0 ? 0 : globalRank,
      level: getInteger(data.level, "level"),
      tier: data.levelName,
      crowns: getInteger(data.crownsEarned, "crowns"),
    };
  },
  data: (data: HyloData) => ({
    XP: {
      "Current Season XP": data.currentSeasonXp,
      "All Season XP": data.allSeasonXp,
      "XP per Day": data.xpPerDay,
      "Referral XP": data.referralXp,
      Referrals: data.referrals,
      Crowns: data.crowns,
      Level: data.level,
      Tier: data.tier,
    },
  }),
  total: (data: HyloData) => ({ XP: data.currentSeasonXp }),
  rank: (data: HyloData) => data.rank,
  supportedAddressTypes: ["svm"],
} satisfies AdapterExport<HyloData>;
