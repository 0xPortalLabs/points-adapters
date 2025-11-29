import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://api.ramen.finance/v1/rewards?address={address}",
);

/**
{
  status: "OK",
  data: {
    amount: 0,
    amount_in_ether: "0.000000000000000000",
    rewards: 792360000000000000000,
    rewards_in_ether: "792.360000000000000000"
  }
}
   */
export default {
  fetch: async (address: string) => {
    const res = await fetch(API_URL.replace("{address}", address));
    if (!res.ok)
      throw new Error(`Failed to fetch ramen data ${await res.text()}`);
    return (await res.json()).data;
  },
  data: (data: Record<string, string>) => ({
    Gacha: {
      Amount: parseFloat(data.amount_in_ether),
      Rewards: parseFloat(data.rewards_in_ether),
    },
  }),
  total: (data: Record<string, string>) => ({
    Gacha: parseFloat(data.rewards_in_ether),
  }),
} as AdapterExport;
