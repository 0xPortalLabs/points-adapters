import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://api.dolomite.io/milestones/{address}/mineral"
);
const AIRDROP_URL = await maybeWrapCORSProxy(
  "https://api.dolomite.io/airdrop/regular/{address}"
);

// {amount: number | null, rank: number | null}
export default {
  fetch: async (address: string) => {
    const [milestones, airdrop] = await Promise.all([
      (await fetch(API_URL.replace("{address}", address))).json(),
      (await fetch(AIRDROP_URL.replace("{address}", address))).json(),
    ]);

    return { milestones, airdrop: airdrop.airdrop };
  },
  data: ({
    milestones,
    airdrop,
  }: {
    milestones: { amount: number | null; rank: number | null };
    airdrop?: { amount: string; level_snapshot: number };
  }) => {
    return {
      Minerals: {
        amount: milestones.amount ?? 0,
        rank: milestones.rank ?? 0,
        airdrop: airdrop?.amount ?? 0,
        level: airdrop?.level_snapshot ?? 0,
      },
    };
  },
  total: ({ milestones }: { milestones: { amount?: number } }) => ({
    Minerals: milestones.amount ?? 0,
  }),
  rank: (data: { rank: number | null }) => data.rank ?? undefined,
  // If they have airdrop data then it is probably claimable.
  claimable: ({ airdrop }: { airdrop?: unknown }) => Boolean(airdrop),
  deprecated: () => ({
    Minerals: 1736467200, // Jan 10th 00:00 UTC
  }),
} as AdapterExport;
