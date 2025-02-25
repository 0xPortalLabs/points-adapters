import type { AdapterExport } from "../utils/adapter.ts";

// NOTE: API supports querying by date
// https://api.fuul.xyz/api/v1/payouts/leaderboard?user_address=0xD2eE2776F34Ef4E7325745b06E6d464b08D4be0E&from=2025-01-27T00:00:00.000Z&to=2025-01-27T23:59:59.999Z
const API_URL =
  "https://api.fuul.xyz/api/v1/payouts/leaderboard?user_address={address}";
const API_KEY =
  "983ef6bfd983055a38fbc436251c98624cb8de5da4767d1b6830a36849171ac2";

/*
{
    address: "0xd2ee2776f34ef4e7325745b06e6d464b08d4be0e",
    total_amount: "30460531657",
    affiliate_code: null,
    rank: 3,
    total_attributions: 68,
}
*/
export default {
  fetch: async (address: string) => {
    const res = await (
      await fetch(API_URL.replace("{address}", address), {
        headers: { Authorization: `Bearer ${API_KEY}` },
      })
    ).json();
    return res.results[0];
  },
  points: (data: Record<string, number | string>) => {
    return {
      total_amount: parseFloat(String(data?.total_amount)) || 0,
      rank: data?.rank ?? 0,
      total_attributions: data?.total_attributions ?? 0,
    };
  },
  total: (data: { total_amount?: number }) =>
    parseFloat(String(data?.total_amount)) ?? 0,
  rank: (data: { rank: number }) => data.rank,
} as AdapterExport;
