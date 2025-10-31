import { AdapterExport } from "../utils/adapter";
import { maybeWrapCORSProxy } from "../utils/cors";
import { convertKeysToStartCase } from "../utils/object";

// {
//     "page": 1,
//     "page_size": 1,
//     "results": [
//         {
//             "address": "0x243002fdc173a66a07ad9dee3a1466509b4203c4",
//             "total_amount": 632,
//             "affiliate_code": null,
//             "rank": 35053,
//             "total_attributions": 5,
//             "tiers": {
//                 "Weekly 100M Points Distribution": "6 consecutive trailing weeks"
//             }
//         }
//     ],
//     "total_results": 1,
//     "calculated_at": "2025-10-31T11:54:48.814Z"
// }

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
  "https://api.fuul.xyz/api/v1/payouts/leaderboard/points?page=1&page_size=1&user_identifier={address}4&user_identifier_type=evm_address&fields=tier"
);

export default {
  fetch: async (address: string) => {
    const res = await fetch(API_URL.replace("{address}", address));
    return await res.json();
  },
  data: (data: ApiResponse) => {
    if (!data || !data.results || data.results.length === 0) return {};

    const { tiers, ...rest } = data.results[0];

    const flattened = {
      ...rest,
      ...(tiers &&
        Object.fromEntries(
          Object.entries(tiers).map(([k, v]) => [`Tiers: ${k}`, v])
        )),
    };

    return convertKeysToStartCase(flattened);
  },
  total: (data: ApiResponse) => {
    if (!data) return 0;
    return data.results[0].total_amount;
  },
  rank: (data: ApiResponse) => {
    if (!data) return 0;
    return data.results[0].rank;
  },
} as AdapterExport;
