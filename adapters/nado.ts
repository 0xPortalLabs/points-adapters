import { formatUnits, getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const ARCHIVE_URL = await maybeWrapCORSProxy("https://archive.prod.nado.xyz/v1");

type PointsEpoch = {
  epoch: number;
  description: string;
  start_time: string;
  end_time: string;
  total_points: string;
  points: string;
  rank: number;
  tier: number;
};

type PointsTotal = {
  points: string;
  rank: number;
  tier: number;
};

type PointsResponse = {
  points_per_epoch: PointsEpoch[];
  all_time_points: PointsTotal;
};

type API_RESPONSE = PointsResponse;

const toPointsNumber = (value: string | undefined): number => {
  if (!value) return 0;
  return Number(formatUnits(BigInt(value), 18)) || 0;
};

const fetchPoints = async (address: string): Promise<PointsResponse> => {
  const res = await fetch(ARCHIVE_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      nado_points: { address },
    }),
  });

  if (!res.ok) {
    throw new Error(`Nado points request failed with status ${res.status}`);
  }

  return await res.json() as PointsResponse;
};

const getCurrentEpoch = (response: PointsResponse): PointsEpoch | undefined =>
  [...response.points_per_epoch].reverse().find((epoch) => epoch.points !== "0");

const buildEpochBreakdown = (epochs: PointsEpoch[]) =>
  Object.fromEntries(
    [...epochs]
      .sort((a, b) => b.epoch - a.epoch)
      .map((epoch) => [
        epoch.description,
        {
          Points: toPointsNumber(epoch.points),
          Rank: epoch.rank,
          Tier: epoch.tier,
        },
      ])
  );

export default {
  fetch: async (address: string) => {
    const normalizedAddress = getAddress(address).toLowerCase();
    return await fetchPoints(normalizedAddress);
  },
  data: (response: API_RESPONSE) => {
    const currentEpoch = getCurrentEpoch(response);

    return {
      Points: toPointsNumber(response.all_time_points.points),
      Rank: response.all_time_points.rank,
      Tier: response.all_time_points.tier,
      Summary: {
        "All Time Points": toPointsNumber(response.all_time_points.points),
        "All Time Rank": response.all_time_points.rank,
        Tier: response.all_time_points.tier,
      },
      ...(currentEpoch
        ? {
            "Latest Active Epoch": {
              Name: currentEpoch.description,
              Points: toPointsNumber(currentEpoch.points),
              Rank: currentEpoch.rank,
              Tier: currentEpoch.tier,
            },
          }
        : {}),
      "Distribution History": buildEpochBreakdown(response.points_per_epoch),
    };
  },
  total: (response: API_RESPONSE) =>
    toPointsNumber(response.all_time_points.points),
  rank: (response: API_RESPONSE) => response.all_time_points.rank,
  supportedAddressTypes: ["evm"],
} as AdapterExport;
