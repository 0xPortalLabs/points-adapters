import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://questing-api.katana.network/api/users/{address}",
);

type API_RESPONSE = {
  monthStart?: string;
  totalXp: number;
  recurringXp: number;
  oneTimeXp: number;
  percentile?: string;
  tier?: string;
};

const emptyResponse = (): API_RESPONSE => ({
  totalXp: 0,
  recurringXp: 0,
  oneTimeXp: 0,
});

const getNumber = (
  value: unknown,
  field: string,
): number => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`Katana response has invalid ${field}`);
  }

  return value;
};

const getOptionalString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;

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
        "Katana XP request failed before receiving a response",
        { cause: error },
      );
    }

    if (res.status === 404) return emptyResponse();
    if (!res.ok) {
      throw new Error(`Katana XP request failed with status ${res.status}`);
    }

    const data: unknown = await res.json();
    if (!data || typeof data !== "object") {
      throw new Error("Katana response has invalid data");
    }

    const response = data as Record<string, unknown>;
    const user = response.user as Record<string, unknown> | undefined;
    const currentMonth = response.currentMonth as
      | Record<string, unknown>
      | undefined;

    if (!user || !currentMonth) {
      throw new Error("Katana response has no user XP data");
    }
    if (
      typeof user.id !== "string" ||
      user.id.toLowerCase() !== normalizedAddress
    ) {
      throw new Error("Katana response returned a different wallet");
    }

    return {
      monthStart: getOptionalString(currentMonth.monthStart),
      totalXp: getNumber(currentMonth.totalXp, "total XP"),
      recurringXp: getNumber(currentMonth.recurringXp, "recurring XP"),
      oneTimeXp: getNumber(currentMonth.lifetimeOneTimeXp, "one-time XP"),
      percentile: getOptionalString(currentMonth.percentile),
      tier: getOptionalString(user.tier),
    };
  },
  data: (data: API_RESPONSE) => ({
    XP: {
      "Total XP": data.totalXp,
      "Recurring XP": data.recurringXp,
      "One-Time XP": data.oneTimeXp,
      ...(data.monthStart ? { Month: data.monthStart.slice(0, 7) } : {}),
      ...(data.percentile ? { Percentile: data.percentile } : {}),
      ...(data.tier ? { Tier: data.tier } : {}),
    },
  }),
  total: (data: API_RESPONSE) => ({ XP: data.totalXp }),
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<API_RESPONSE>;
