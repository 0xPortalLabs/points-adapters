import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://api.symbiotic.fi/api/v1/points/receiver/{address}/current",
);

interface PointsData {
  points_type: string;
  last_block: number;
  total_points: string;
  items: Array<{
    points: string;
    vault_address?: string;
    receiver_address?: string;
  }>;
}

const SYMBIOTIC_POINTS_DECIMALS = 48;

const EMPTY_POINTS_DATA: PointsData = {
  points_type: "symbiotic",
  last_block: 0,
  total_points: "0",
  items: [],
};

const getSymbioticPointsData = (data: PointsData[]) =>
  data.find((x) => x.points_type === "symbiotic") ?? EMPTY_POINTS_DATA;

const getPoints = (points: string) => {
  const divisor = 10n ** BigInt(SYMBIOTIC_POINTS_DECIMALS);
  const rawPoints = BigInt(points);
  const whole = rawPoints / divisor;
  const remainder = rawPoints % divisor;

  return parseFloat(
    `${whole}.${
      remainder
        .toString()
        .padStart(SYMBIOTIC_POINTS_DECIMALS, "0")
    }`,
  );
};

export default {
  fetch: async (address: string) => {
    return (
      await fetch(API_URL.replace("{address}", address), {
        headers: {
          "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
        },
      })
    ).json();
  },
  data: (data: PointsData[]) => {
    const pointsData = getSymbioticPointsData(data);

    return {
      "Symbiotic Points": {
        "Symbiotic Points": getPoints(pointsData.total_points),
        "Last Block": pointsData.last_block,
      },
    };
  },
  total: (data: PointsData[]) => ({
    "Symbiotic Points": getPoints(getSymbioticPointsData(data).total_points),
  }),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
