import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://v8mz1llzwi.execute-api.us-east-1.amazonaws.com/rewards/{address}",
);

type SakeRewardsResponse = {
  currentRate?: string;
  points?: string;
  pointsFromReferrals?: string;
  spinPoints?: string;
  spins?: {
    total?: number;
    used?: number;
  };
  tier?: {
    name?: string;
    multiplier?: string;
    pointsMax?: string;
    pointsMin?: string;
  };
};

const getSakePoints = (data: SakeRewardsResponse): number =>
  Number(data.points ?? 0) || 0;

const roundNumber = (value: string | undefined, decimals: number): number => {
  const number = Number(value ?? 0) || 0;
  return Number(number.toFixed(decimals));
};

export default {
  fetch: async (address: string) => {
    const normalizedAddress = getAddress(address).toLowerCase();
    const res = await fetch(
      API_URL.replace("{address}", encodeURIComponent(normalizedAddress)),
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
        },
      },
    );

    if (!res.ok) {
      throw new Error(
        `Sake rewards request failed with status ${res.status}`,
      );
    }

    return await res.json() as SakeRewardsResponse;
  },
  data: (data: SakeRewardsResponse) => ({
    "Sake Points": {
      Points: getSakePoints(data),
      "Current Rate": roundNumber(data.currentRate, 6),
      "Referral Points": Number(data.pointsFromReferrals ?? 0) || 0,
      "Lucky Spin Points": Number(data.spinPoints ?? 0) || 0,
      "Spins Total": Number(data.spins?.total ?? 0) || 0,
      "Spins Used": Number(data.spins?.used ?? 0) || 0,
      Tier: data.tier?.name ?? "N/A",
      "Tier Multiplier": Number(data.tier?.multiplier ?? 0) || 0,
    },
  }),
  total: (data: SakeRewardsResponse) => ({
    "Sake Points": getSakePoints(data),
  }),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
