import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://api.upshift.finance/v1/points/{address}",
);

type UpshiftResponse = {
  totalPoints?: unknown;
};

const getPoints = (data: UpshiftResponse): number => {
  const value = data.totalPoints;
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    (typeof value === "string" && !value.trim())
  ) {
    throw new Error("Upshift response has no total points");
  }

  const points = Number(value);
  if (!Number.isFinite(points) || points < 0) {
    throw new Error("Upshift response has invalid total points");
  }

  return points;
};

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
      throw new Error(`Upshift request failed with status ${res.status}`);
    }

    const data = await res.json();
    if (!data || typeof data !== "object") {
      throw new Error("Upshift response has invalid data");
    }

    return data as UpshiftResponse;
  },
  data: (data: UpshiftResponse) => ({
    "Upshift Points": getPoints(data),
  }),
  total: getPoints,
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<UpshiftResponse>;
