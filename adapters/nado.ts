import { formatUnits, getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const ARCHIVE_URL = await maybeWrapCORSProxy(
  "https://archive.prod.nado.xyz/v1",
);

type PointsBreakdown = {
  points: string;
  rank: number;
  tier: number;
};

type PointsEpoch = PointsBreakdown & {
  epoch: number;
  description: string;
};

type PointsResponse = {
  points_per_epoch: PointsEpoch[];
  all_time_points: PointsBreakdown;
};

type API_RESPONSE = PointsResponse;

const headers = {
  accept: "application/json",
  "content-type": "application/json",
};

const toPointsNumber = (value: string | undefined): number => {
  if (!value) return 0;
  return Number(formatUnits(BigInt(value), 18)) || 0;
};

const buildPointsBreakdown = (points: PointsBreakdown) => ({
  Points: toPointsNumber(points.points),
  Rank: points.rank,
  Tier: points.tier,
});

const fetchPoints = async (address: string): Promise<PointsResponse> => {
  const res = await fetch(ARCHIVE_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      nado_points: { address },
    }),
  });

  if (!res.ok) {
    throw new Error(`Nado points request failed with status ${res.status}`);
  }

  return await res.json() as PointsResponse;
};

const buildEpochBreakdown = (epochs: PointsEpoch[]) =>
  Object.fromEntries(
    [...epochs]
      .sort((a, b) => b.epoch - a.epoch)
      .map((epoch) => [epoch.description, buildPointsBreakdown(epoch)]),
  );

export default {
  fetch: async (address: string) => {
    const normalizedAddress = getAddress(address).toLowerCase();
    return await fetchPoints(normalizedAddress);
  },
  data: (response: API_RESPONSE) => ({
    ...buildEpochBreakdown(response.points_per_epoch),
    "All Time": buildPointsBreakdown(response.all_time_points),
  }),
  total: (response: API_RESPONSE) =>
    toPointsNumber(response.all_time_points.points),
  rank: (response: API_RESPONSE) => response.all_time_points.rank,
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<API_RESPONSE>;
