import { formatUnits, getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";

const REWARDS_URL = "https://api.prod.nado.xyz/rewards/v1";

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
  "x-nado-client-type": "nado",
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

const isPointsBreakdown = (value: unknown): value is PointsBreakdown => {
  if (!value || typeof value !== "object") return false;

  const points = value as Record<string, unknown>;
  return typeof points.points === "string" &&
    typeof points.rank === "number" &&
    typeof points.tier === "number";
};

const isPointsResponse = (value: unknown): value is PointsResponse => {
  if (!value || typeof value !== "object") return false;

  const response = value as Record<string, unknown>;
  return Array.isArray(response.points_per_epoch) &&
    response.points_per_epoch.every((epoch) => {
      if (!isPointsBreakdown(epoch)) return false;
      const pointsEpoch = epoch as unknown as Record<string, unknown>;
      return typeof pointsEpoch.epoch === "number" &&
        typeof pointsEpoch.description === "string";
    }) && isPointsBreakdown(response.all_time_points);
};

const fetchPoints = async (address: string): Promise<PointsResponse> => {
  const res = await fetch(REWARDS_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      nado_points: { address },
    }),
  });

  if (!res.ok) {
    throw new Error(`Nado points request failed with status ${res.status}`);
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new Error("Nado points request returned invalid JSON");
  }

  if (!isPointsResponse(data)) {
    throw new Error("Nado points request returned a malformed response");
  }

  return data;
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
