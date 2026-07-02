import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://app.tori.finance/api/points/me?address={address}",
);

type ToriPointsResponse = {
  totalCores?: number;
  totalEarnings?: number;
  ecosystemBalance?: number | null;
  costBasis?: number;
  netShares?: number;
};

const getCores = (data: ToriPointsResponse): number =>
  Number(data.totalCores ?? 0) || 0;

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
      throw new Error(`Tori points request failed with status ${res.status}`);
    }

    return await res.json() as ToriPointsResponse;
  },
  data: (data: ToriPointsResponse) => ({
    Cores: getCores(data),
    "Total Earnings": Number(data.totalEarnings ?? 0) || 0,
    "Ecosystem Balance": Number(data.ecosystemBalance ?? 0) || 0,
    "Cost Basis": Number(data.costBasis ?? 0) || 0,
    "Net Shares": Number(data.netShares ?? 0) || 0,
  }),
  total: (data: ToriPointsResponse) => ({
    Cores: getCores(data),
  }),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
