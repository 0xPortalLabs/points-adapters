import { formatUnits, getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const ARCHIVE_URL = await maybeWrapCORSProxy("https://archive.prod.nado.xyz/v1");
const FUUL_API_BASE_URL = await maybeWrapCORSProxy("https://api.fuul.xyz/api/v1");

const FUUL_API_KEY =
  "777a33c4c76c8a5fc22093bb7f83fa63dd428cd90e07fc603f2f87a5fd43e8ff";

const fuulHeaders = {
  accept: "application/json",
  authorization: `Bearer ${FUUL_API_KEY}`,
  "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
};

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

type ReferralStatusResponse = {
  referred?: boolean;
  code?: string;
  referrer_identifier?: string;
  referrer_identifier_type?: string;
  referred_at?: string;
};

type API_RESPONSE = {
  points: PointsResponse;
  referralStatus: ReferralStatusResponse;
};

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

const fetchReferralStatus = async (
  address: string
): Promise<ReferralStatusResponse> => {
  const params = new URLSearchParams({
    user_identifier: address,
    user_identifier_type: "evm_address",
  });
  const res = await fetch(
    `${FUUL_API_BASE_URL}/referral_codes/status?${params}`,
    { headers: fuulHeaders }
  );

  if (res.status === 404) {
    return { referred: false };
  }

  if (!res.ok) {
    throw new Error(`Nado referral status request failed with status ${res.status}`);
  }

  return await res.json() as ReferralStatusResponse;
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
    const [points, referralStatus] = await Promise.all([
      fetchPoints(normalizedAddress),
      fetchReferralStatus(normalizedAddress).catch(() => ({ referred: false })),
    ]);

    return { points, referralStatus };
  },
  data: (response: API_RESPONSE) => {
    const currentEpoch = getCurrentEpoch(response.points);

    return {
      Points: toPointsNumber(response.points.all_time_points.points),
      Rank: response.points.all_time_points.rank,
      Tier: response.points.all_time_points.tier,
      Summary: {
        "All Time Points": toPointsNumber(response.points.all_time_points.points),
        "All Time Rank": response.points.all_time_points.rank,
        Tier: response.points.all_time_points.tier,
        Referred: response.referralStatus.referred ? "Yes" : "No",
        "Referral Code": response.referralStatus.code ?? "",
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
      "Distribution History": buildEpochBreakdown(response.points.points_per_epoch),
    };
  },
  total: (response: API_RESPONSE) =>
    toPointsNumber(response.points.all_time_points.points),
  rank: (response: API_RESPONSE) => response.points.all_time_points.rank,
  supportedAddressTypes: ["evm"],
} as AdapterExport;
