import type { AdapterExport } from "../utils/adapter.ts";

const API_URL = "https://app.henlo.com/api/user/points?addresses={address}";

/*
{
  data: [
    {
      [...]
      points: 420.69,
      claimed: true,
      community: "Base allocation",
      [...]
    },
    [...]
  ],
  claimed: true,
  totalPoints: 1234,
}
*/
export default {
  fetch: async (address: string) => {
    return await (await fetch(API_URL.replace("{address}", address))).json();
  },
  points: (data: { data: Record<string, number | string>[] }) => {
    return Object.fromEntries(data.data.map((x) => [x.community, x.points]));
  },
  total: (data: { totalPoints: number }) => data.totalPoints,
  claimable: (data: { claimed: boolean }) => data.claimed,
} as AdapterExport;
