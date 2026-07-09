import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://api10.afx.xyz/info/points/user?userAddr={address}",
);

type UserPoints = {
  userAddr: string;
  totalPoints: number | string;
  tradingPoints: number | string;
  lpPoints: number | string;
  teamPoints: number | string;
  bonusPoints: number | string;
  cumulativeVolume: number | string;
  cumulativeRealizedPnl: number | string;
  lastSettledWeek: string | null;
  currentRank: number | null;
};

type API_RESPONSE = {
  code: number;
  message?: string;
  data?: UserPoints;
};

const toNumber = (value: number | string | null | undefined): number =>
  Number(value ?? 0) || 0;

const getPoints = (data: API_RESPONSE): UserPoints => {
  if (!data.data) {
    return {
      userAddr: "",
      totalPoints: 0,
      tradingPoints: 0,
      lpPoints: 0,
      teamPoints: 0,
      bonusPoints: 0,
      cumulativeVolume: 0,
      cumulativeRealizedPnl: 0,
      lastSettledWeek: null,
      currentRank: null,
    };
  }

  return data.data;
};

export default {
  fetch: async (address: string): Promise<API_RESPONSE> => {
    const normalizedAddress = getAddress(address).toLowerCase();
    const response = await fetch(
      API_URL.replace("{address}", normalizedAddress),
      {
        headers: {
          "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `AFX points request failed with status ${response.status}`,
      );
    }

    const data = await response.json() as API_RESPONSE;
    if (data.code !== 0) {
      throw new Error(
        data.message ?? `AFX points request failed: ${data.code}`,
      );
    }

    return data;
  },
  data: (data: API_RESPONSE) => {
    const points = getPoints(data);

    return {
      Points: {
        "Total Points": toNumber(points.totalPoints),
        "Trading Points": toNumber(points.tradingPoints),
        "LP Points": toNumber(points.lpPoints),
        "Team Points": toNumber(points.teamPoints),
        "Bonus Points": toNumber(points.bonusPoints),
        "Cumulative Volume": toNumber(points.cumulativeVolume),
        "Cumulative Realized PnL": toNumber(points.cumulativeRealizedPnl),
        "Last Settled Week": points.lastSettledWeek ?? "N/A",
        Rank: toNumber(points.currentRank),
      },
    };
  },
  total: (data: API_RESPONSE) => ({
    Points: toNumber(getPoints(data).totalPoints),
  }),
  rank: (data: API_RESPONSE) => toNumber(getPoints(data).currentRank),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
