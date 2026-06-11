import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const WEBSITE_ID = "08972bb4-3d25-4097-b5bf-bebb4b88703e";
const ORGANIZATION_ID = "bdc4243b-9939-4713-befc-1606909f1c6e";
const LOYALTY_CURRENCY_ID = "bbd4b7f7-1e8b-404c-b795-ebb341678752";

const API_URL = await maybeWrapCORSProxy(
  "https://quests.onebanking.app/api/loyalty/accounts" +
    `?websiteId=${WEBSITE_ID}` +
    `&organizationId=${ORGANIZATION_ID}` +
    `&loyaltyCurrencyId=${LOYALTY_CURRENCY_ID}` +
    "&walletAddress={address}" +
    "&limit=1",
);

type OneBankingAccount = {
  amount?: string;
  updatedAt?: string;
};

type OneBankingResponse = {
  data?: OneBankingAccount[];
};

const getPoints = (data: OneBankingResponse): number =>
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
      throw new Error(
        `OneBanking points request failed with status ${res.status}`,
      );
    }

    return await res.json() as OneBankingResponse;
  },
  data: (data: OneBankingResponse) => ({
    "OneBanking Points": getPoints(data),
    "Last Updated": data.data?.[0]?.updatedAt ?? "N/A",
  }),
  total: getPoints,
  supportedAddressTypes: ["evm"],
} as AdapterExport;
