import type { AdapterExport } from "../utils/adapter.ts";

const API_URL = "https://cmeth.api.methprotocol.xyz/points/s3/{address}";

type PointsData = {
  walletAddress: string;
  totalPoints: number;
  tokenPoints: number;
  referralPoints: number;
  rank: string;
  referralRank: string;
  date: string;
  l2Points: number;
  methAmount: number;
  cmethAmount: number;
};

type APIResponse = {
  message: string;
  code: number;
  data: PointsData | null;
};

const isPointsData = (value: unknown): value is PointsData => {
  if (!value || typeof value !== "object") return false;

  const data = value as Record<string, unknown>;
  return (
    typeof data.walletAddress === "string" &&
    typeof data.totalPoints === "number" &&
    typeof data.tokenPoints === "number" &&
    typeof data.referralPoints === "number" &&
    typeof data.rank === "string" &&
    typeof data.referralRank === "string" &&
    typeof data.date === "string" &&
    typeof data.l2Points === "number" &&
    typeof data.methAmount === "number" &&
    typeof data.cmethAmount === "number"
  );
};

export default {
  fetch: async (address: string) => {
    const response = await fetch(
      API_URL.replace("{address}", address.toLowerCase()),
    );
    if (!response.ok) {
      throw new Error(
        `mETH Protocol request failed with status ${response.status}`,
      );
    }

    let responseData: unknown;
    try {
      responseData = await response.json();
    } catch {
      throw new Error("mETH Protocol returned an invalid JSON response");
    }

    if (!responseData || typeof responseData !== "object") {
      throw new Error("mETH Protocol returned a malformed response");
    }

    const result = responseData as Partial<APIResponse>;
    if (result.code !== 0 || !("data" in result)) {
      throw new Error("mETH Protocol returned a malformed points response");
    }

    const pointsData = result.data;
    if (pointsData !== null && !isPointsData(pointsData)) {
      throw new Error("mETH Protocol returned a malformed points response");
    }

    return pointsData;
  },
  data: (data: PointsData | null) => {
    return data
      ? {
        "Total Points": data.totalPoints,
        "Token Points": data.tokenPoints,
        "Referral Points": data.referralPoints,
        Rank: data.rank,
        "Referral Rank": data.referralRank,
        Date: data.date,
        "L2 Points": data.l2Points,
        "mETH Amount": data.methAmount,
        "cmETH Amount": data.cmethAmount,
      }
      : {};
  },
  total: (data: PointsData | null) => data?.totalPoints ?? 0,
  rank: (data: PointsData | null) => parseInt(data?.rank || "0"),
  deprecated: () => ({
    Points: 1758412800, // September 21st 2025 00:00 UTC
  }),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
