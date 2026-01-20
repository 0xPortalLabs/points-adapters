import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://api.ramen.finance/v1/rewards?address={address}"
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
    return (
      await (
        await fetch(API_URL.replace("{address}", address), {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          },
        })
      ).json()
    ).data;
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
