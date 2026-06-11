import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const WEBSITE_ID = "5b807696-bd6b-4c6c-b169-6982aa7fd7ad";
const ORGANIZATION_ID = "8493fc88-5e71-41b2-9156-07f6561687ae";
const LOYALTY_CURRENCY_ID = "cc01987c-08d9-4e06-803e-b4118aef5dfd";

const API_URL = await maybeWrapCORSProxy(
  "https://quest.quip.network/api/loyalty/accounts" +
    `?websiteId=${WEBSITE_ID}` +
    `&organizationId=${ORGANIZATION_ID}` +
    `&loyaltyCurrencyId=${LOYALTY_CURRENCY_ID}` +
    "&walletAddress={address}" +
    "&limit=1",
);

type QuipAccount = {
  amount?: string;
  updatedAt?: string;
};

type QuipResponse = {
  data?: QuipAccount[];
};

const getPoints = (data: QuipResponse): number =>
  Number(data.data?.[0]?.amount ?? 0) || 0;

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
      throw new Error(`Quip points request failed with status ${res.status}`);
    }

    return await res.json() as QuipResponse;
  },
  data: (data: QuipResponse) => ({
    "Quip Points": getPoints(data),
    "Last Updated": data.data?.[0]?.updatedAt ?? "N/A",
  }),
  total: getPoints,
  supportedAddressTypes: ["evm"],
} as AdapterExport;
