import type { AdapterExport } from "../utils/adapter.ts";

import { convertKeysToStartCase } from "../utils/object.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://merits.blockscout.com/api/v1/leaderboard/users/{address}"
);

type API_RESPONSE = {
  total_balance: string;
  referrals: string;
  rank: string;
  users_below: string;
  top_percent: string;
  address: string;
};
export default {
  fetch: async (address) => {
    const res = await fetch(API_URL.replace("{address}", address), {
      headers: {
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
    });
    const data = await res.json();
    if (data.message === "user not found") {
      return {
        total_balance: "0",
        referrals: "0",
        rank: "0",
        users_below: "0",
        top_percent: "0",
      };
    }
    return data;
  },
  data: (data: API_RESPONSE) => {
    const { address, ...rest } = data;
    return { Merits: convertKeysToStartCase(rest) };
  },
  total: (data: API_RESPONSE) => ({ Merits: Number(data.total_balance) }),
  rank: (data: API_RESPONSE) => Number(data.rank),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
