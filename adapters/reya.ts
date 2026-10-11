import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";

import { convertKeysToStartCase } from "../utils/object.ts";

const API_URL = "https://api.reya.xyz/api/incentives/wallet/{address}";
// 0xefcbfd73d67f92b37713e7eb9284e813b8f0e49a
type SeasonPoints = {
  totalPoints: number;
  tradingPoints: number;
  stakingPoints: number;
  signalPoints: number;
  rank: number;
};
type API_RESPONSE = {
  activeSeason: { name: string };
  points: {
    season: SeasonPoints;
    closedSeasons: (SeasonPoints & {
      season: { name: string; endsAt: string };
      forfeited: boolean;
    })[];
  };
  boosts: {
    tradingBoost: number;
    stakingBoost: number;
    loyaltyBoost: number;
  };
};
export default {
  fetch: async (address: string) => {
    const res = await fetch(API_URL.replace("{address}", getAddress(address)), {
      headers: {
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
    });
    if (!res.ok) throw new Error(`Reya API error: ${res.status}`);
    return await res.json();
  },
  // The API now separates the active season from closed seasons instead of
  // returning points.total. Keep historical balances under their own labels.
  data: (data: API_RESPONSE) => ({
    ...Object.fromEntries(
      data.points.closedSeasons.map(({ season, forfeited, ...points }) => [
        season.name,
        {
          ...convertKeysToStartCase(points),
          Forfeited: forfeited ? "Yes" : "No",
        },
      ])
    ),
    [data.activeSeason.name]: convertKeysToStartCase({
      ...data.points.season,
      ...data.boosts,
    }),
  }),
  total: (data: API_RESPONSE) => ({
    ...Object.fromEntries(
      data.points.closedSeasons.map(({ season, totalPoints }) => [
        season.name,
        totalPoints,
      ])
    ),
    [data.activeSeason.name]: data.points.season.totalPoints,
  }),
  rank: (data: API_RESPONSE) => data.points.season.rank,
  deprecated: (data: API_RESPONSE) =>
    Object.fromEntries(
      data.points.closedSeasons.map(({ season }) => [
        season.name,
        Math.floor(Date.parse(season.endsAt) / 1000),
      ])
    ),
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<API_RESPONSE>;
