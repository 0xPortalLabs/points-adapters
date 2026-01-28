import { getAddress } from "viem";
import { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";
import { convertKeysToStartCase } from "../utils/object.ts";

//"address": "0x243002fdc173a66a07ad9dee3a1466509b4203c4",

type ApiResponse = {
  page: number;
  page_size: number;
  results: {
    address: string;
    total_amount: number;
    affiliate_code: string | null;
    rank: number;
    total_attributions: number;
    tiers: Record<string, string>;
  }[];
  total_results: number;
  calculated_at: string;
};
const API_URL = await maybeWrapCORSProxy(
  "https://api.fuul.xyz/api/v1/payouts/leaderboard/points?user_identifier={address}&user_identifier_type=evm_address&fields=tier"
);

export default {
  fetch: async (address: string) => {
    const res = await fetch(API_URL.replace("{address}", getAddress(address)), {
      headers: {
        Authorization:
          "Bearer dd0f4f26be36808799f3d1ac5c87c850b58e8f03b964878f9680825132c29c06",
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
    });
    return await res.json();
  },
  data: (data: ApiResponse) => {
    if (!data || !data.results || data.results.length === 0) return {};

    const { tiers, ...rest } = data.results[0];

    const flattened = {
      ...(rest &&
        Object.fromEntries(
          Object.entries(rest).filter(
            ([k, v]) => v !== null && v !== undefined && k !== "address"
          )
        )),
      ...(tiers &&
        Object.fromEntries(
          Object.entries(tiers).map(([k, v]) => [`Tiers: ${k}`, v])
        )),
    };

    return convertKeysToStartCase(flattened);
  },
  total: (data: ApiResponse) => {
    if (!data || !data.results || data.results.length === 0) return 0;
    return data.results[0].total_amount;
  },
  rank: (data: ApiResponse) => {
    if (!data || !data.results || data.results.length === 0) return 0;
    return data.results[0].rank;
  },
} as AdapterExport;
