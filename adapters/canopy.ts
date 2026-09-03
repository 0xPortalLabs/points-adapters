import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const WEBSITE_ID = "c52fecd3-3906-445b-90ed-6758fc3804cb";
const ORGANIZATION_ID = "dac5bd9d-dbc7-4932-a767-7447d364a9f7";
const LOYALTY_CURRENCY_ID = "aab6646e-449f-4395-bc2b-290ffec002fc";

const API_URL = await maybeWrapCORSProxy(
  "https://admin.snagsolutions.io/api/loyalty/accounts" +
    `?websiteId=${WEBSITE_ID}` +
    `&organizationId=${ORGANIZATION_ID}` +
    `&loyaltyCurrencyId=${LOYALTY_CURRENCY_ID}` +
    "&walletAddress={address}" +
    "&limit=1",
);

type CanopyAccount = {
  amount?: string;
  updatedAt?: string;
};

type CanopyResponse = {
  data?: CanopyAccount[];
};

const getPoints = (data: CanopyResponse): number => {
  const account = data.data?.[0];
  if (!account) return 0;

  if (!account.amount?.trim()) {
    throw new Error("Canopy account response has no amount");
  }

  const points = Number(account.amount);
  if (!Number.isFinite(points)) {
    throw new Error("Canopy account amount is not finite");
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
      throw new Error(`Canopy points request failed with status ${res.status}`);
    }

    return await res.json() as CanopyResponse;
  },
  data: (data: CanopyResponse) => ({
    "Canopy Points": getPoints(data),
    "Last Updated": data.data?.[0]?.updatedAt ?? "N/A",
  }),
  total: getPoints,
  supportedAddressTypes: ["evm"],
} as AdapterExport;
