import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://points-api.xstocks.fi/api/v1/xdrop-user/{address}/dashboard",
);

type XStocksData = {
  walletAddress?: unknown;
  totalPoints?: unknown;
  todayPoints?: unknown;
  referralPoints?: unknown;
  xboostMultiplier?: unknown;
};

const getNumber = (
  data: XStocksData | undefined,
  field: Exclude<keyof XStocksData, "walletAddress">,
): number => {
  if (!data) return 0;

  const value = data[field];
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    (typeof value === "string" && !value.trim())
  ) {
    throw new Error(`xStocks response has no ${field}`);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`xStocks response has invalid ${field}`);
  }

  return parsed;
};

const normalizeAddress = (address: string): string =>
  address.startsWith("0x") ? getAddress(address).toLowerCase() : address;

export default {
  fetch: async (address: string) => {
    const normalizedAddress = normalizeAddress(address);
    const res = await fetch(
      API_URL.replace("{address}", encodeURIComponent(normalizedAddress)),
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
        },
      },
    );

    if (res.status === 404) return undefined;
    if (!res.ok) {
      throw new Error(`xStocks request failed with status ${res.status}`);
    }

    const response = await res.json() as { success?: unknown; data?: unknown };
    if (
      response.success !== true ||
      !response.data ||
      typeof response.data !== "object"
    ) {
      throw new Error("xStocks response has invalid data");
    }

    const data = response.data as XStocksData;
    if (
      typeof data.walletAddress !== "string" ||
      normalizeAddress(data.walletAddress) !== normalizedAddress
    ) {
      throw new Error("xStocks response returned a different wallet");
    }

    return data;
  },
  data: (data: XStocksData | undefined) => ({
    xPoints: getNumber(data, "totalPoints"),
    "Today's xPoints": getNumber(data, "todayPoints"),
    "Referral xPoints": getNumber(data, "referralPoints"),
    "xBoost Multiplier": getNumber(data, "xboostMultiplier"),
  }),
  total: (data: XStocksData | undefined) => getNumber(data, "totalPoints"),
  supportedAddressTypes: ["evm", "svm"],
} satisfies AdapterExport<XStocksData | undefined>;
