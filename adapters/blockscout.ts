import type { AdapterExport } from "../utils/adapter.ts";
import { convertKeysToStartCase } from "../utils/object.ts";

const API_URL =
  "https://merits-staging.blockscout.com/api/v1/leaderboard/users/{address}";

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
      method: "GET",
      headers: {
        Accept: "*/*",
      },
    });
    const data = await res.json();
    if (data.message === "user not found") {
      throw new Error("User not found");
    }
    return data;
  },
  data: (data: API_RESPONSE) => {
    const { total_balance, address, ...rest } = data;
    return {
      Merits: total_balance,
      ...convertKeysToStartCase(rest),
    };
  },
  total: (data: API_RESPONSE) => ({ Merits: Number(data.total_balance) }),
  rank: (data: API_RESPONSE) => Number(data.rank),
} as AdapterExport;
