import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";

const API_URL = "https://onyx-points.vercel.app/api/v1/users/{address}";

type API_RESPONSE = {
  points: number;
};

const emptyResponse = (): API_RESPONSE => ({ points: 0 });

const getPoints = (value: unknown): number => {
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    (typeof value === "string" && !value.trim())
  ) {
    throw new Error("Onyx response has no points");
  }

  const points = Number(value);
  if (!Number.isFinite(points) || points < 0) {
    throw new Error("Onyx response has invalid points");
  }

  return points;
};

export default {
  fetch: async (address: string): Promise<API_RESPONSE> => {
    const normalizedAddress = getAddress(address).toLowerCase();
    let res: Response;
    try {
      res = await fetch(API_URL.replace("{address}", normalizedAddress), {
        headers: {
          Accept: "application/json",
          "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
        },
      });
    } catch (error) {
      throw new Error(
        "Onyx points request failed before receiving a response",
        { cause: error },
      );
    }

    if (res.status === 404) return emptyResponse();
    if (!res.ok) {
      throw new Error(`Onyx points request failed with status ${res.status}`);
    }

    const response: unknown = await res.json();
    if (!response || typeof response !== "object") {
      throw new Error("Onyx response has invalid data");
    }

    const data = (response as Record<string, unknown>).data;
    if (!data || typeof data !== "object") {
      throw new Error("Onyx response has no points data");
    }

    const user = data as Record<string, unknown>;
    if (
      typeof user.address !== "string" ||
      user.address.toLowerCase() !== normalizedAddress
    ) {
      throw new Error("Onyx response returned a different wallet");
    }

    return { points: getPoints(user.points) };
  },
  data: (data: API_RESPONSE) => ({
    "Onyx Points": {
      Total: data.points,
    },
  }),
  total: (data: API_RESPONSE) => ({ "Onyx Points": data.points }),
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<API_RESPONSE>;
