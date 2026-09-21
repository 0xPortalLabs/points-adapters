import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";

// Public Monad points API; supports direct browser requests without a proxy.
const API_URL =
  "https://api.drake.exchange/drx-points/143/api/pointsRewards/summary?tradeUser={address}&rewardsType=1";

type DrakeData = {
  points: number;
  currentEpochPoints: number;
  rank: number;
};

const getNumber = (value: unknown, field: string): number => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`Drake response has invalid ${field}`);
  }

  return value;
};

export default {
  fetch: async (address: string): Promise<DrakeData> => {
    const normalizedAddress = getAddress(address).toLowerCase();
    let res: Response;
    try {
      res = await fetch(API_URL.replace("{address}", normalizedAddress), {
        headers: { Accept: "application/json" },
      });
    } catch (error) {
      throw new Error(
        "Drake points request failed before receiving a response",
        { cause: error },
      );
    }

    if (!res.ok) {
      throw new Error(`Drake points request failed with status ${res.status}`);
    }

    const response: unknown = await res.json();
    if (!response || typeof response !== "object") {
      throw new Error("Drake response has invalid data");
    }

    const result = response as Record<string, unknown>;
    if (
      result.success !== true || !result.data || typeof result.data !== "object"
    ) {
      throw new Error("Drake response has no points data");
    }

    const data = result.data as Record<string, unknown>;
    if (
      typeof data.tradeUser !== "string" ||
      data.tradeUser.toLowerCase() !== normalizedAddress ||
      data.rewardsType !== 1
    ) {
      throw new Error(
        "Drake response returned a different wallet or reward type",
      );
    }

    // Only an explicit null summary denotes a wallet without points.
    if (data.summary === null) {
      return { points: 0, currentEpochPoints: 0, rank: 0 };
    }
    if (!data.summary || typeof data.summary !== "object") {
      throw new Error("Drake response has invalid points summary");
    }

    const summary = data.summary as Record<string, unknown>;
    if (
      typeof summary.tradeUser !== "string" ||
      summary.tradeUser.toLowerCase() !== normalizedAddress ||
      summary.rewardsType !== 1
    ) {
      throw new Error(
        "Drake summary returned a different wallet or reward type",
      );
    }

    // rewards is cumulative across weekly epochs, not just the latest epoch.
    const points = getNumber(summary.rewards, "total points");
    const currentEpochPoints = getNumber(
      summary.currentEpochRewards,
      "current epoch points",
    );
    const rank = getNumber(summary.rank, "rank");
    if (!Number.isInteger(rank) || currentEpochPoints > points) {
      throw new Error("Drake response has inconsistent points or rank");
    }

    return { points, currentEpochPoints, rank: points === 0 ? 0 : rank };
  },
  data: (data: DrakeData) => ({
    "Drake Points": {
      Total: data.points,
      "Current Epoch Points": data.currentEpochPoints,
    },
  }),
  total: (data: DrakeData) => ({ "Drake Points": data.points }),
  rank: (data: DrakeData) => data.rank,
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<DrakeData>;
