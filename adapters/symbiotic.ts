import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://app.symbiotic.fi/api/v2/dashboard/{address}"
);

interface PointsData {
  pointsType: string;
  decimals: number;
  points: string;
  meta: {
    name: string;
    decimals: number;
  };
}

const getPoints = (obj: PointsData) => {
  const { decimals = 0 } = obj.meta || {};

  if (decimals > 0) {
    const divisor = BigInt(10 ** decimals);
    const whole = BigInt(obj.points) / divisor;
    const remainder = BigInt(obj.points) % divisor;

    return parseFloat(
      `${whole}.${remainder.toString().padStart(decimals, "0")}`
    );
  }

  return parseFloat(obj.points);
};

/*
{
  totalDepositUsd: 233.39078611461593,
  points: [
    {
      pointsType: "symbiotic",
      points: "10850370917202774317295061365457638791959659524777",
      meta: {
        name: "Symbiotic",
        decimals: 48,
        icon: "https://raw.githubusercontent.com/symbioticfi/metadata-mainnet/main/points/symbiotic/logo.png",
      },
    },
    {
      pointsType: "legacy",
      points: "301.89688901123200151775",
      meta: {
        name: "Symbiotic",
        decimals: 0,
        icon: "https://raw.githubusercontent.com/symbioticfi/metadata-holesky/main/points/symbiotic/logo.png",
      },
    },
  ],
  withdrawals: 0,
}
 */
export default {
  fetch: async (address: string) => {
    return (await fetch(API_URL.replace("{address}", address))).json();
  },
  data: (data: { points: PointsData[]; totalDepositUsd: number }) => {
    const pointsData = Object.fromEntries(
      data.points.map((x) => [`${x.meta.name} Points`, getPoints(x)])
    );
    return {
      "Symbiotic Points": {
        ...pointsData,
        "Total Deposit (USD)": data.totalDepositUsd,
      },
    };
  },
  total: (data: { points: PointsData[] }) => ({
    "Symbiotic Points": data.points.reduce(
      (total, x) => total + getPoints(x),
      0
    ),
  }),
} as AdapterExport;
