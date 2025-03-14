import type { AdapterExport } from "../utils/adapter.ts";

const API_URL = "https://api.dolomite.io/milestones/{address}/mineral";

// {amount: number | null, rank: number | null}
export default {
  fetch: async (address: string) => {
    return await (await fetch(API_URL.replace("{address}", address))).json();
  },
  points: (data: { amount: number | null; rank: number | null }) => ({
    Minerals: {
      amount: data.amount ?? 0,
      rank: data.rank ?? 0,
    },
  }),
  total: (data: { amount?: number }) => ({ Minerals: data.amount ?? 0 }),
  rank: (data: { rank: number | null }) => data.rank ?? undefined,
  deprecated: (_data) => ({
    Minerals: 1736467200, // Jan 10th 00:00 UTC
  }),
} as AdapterExport;
