import type { AdapterExport } from "../utils/adapter.ts";

import { checksumAddress } from "viem";

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
    address = checksumAddress(address as `0x${string}`);

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
    milestones: { amount: string; rank: number | null };
    airdrop?: { amount: string; level_snapshot: number };
  }) => {
    return {
      Minerals: {
        Amount: parseFloat(milestones.amount) ?? 0,
        Rank: milestones.rank ?? 0,
        Airdrop: airdrop?.amount ?? 0,
        Level: airdrop?.level_snapshot ?? 0,
      },
    };
  },
  total: ({ milestones }: { milestones: { amount: string } }) => ({
    Minerals: parseFloat(milestones.amount) ?? 0,
  }),
  rank: ({ milestones }: { milestones: { rank: number | null } }) =>
    milestones.rank,
  // If they have airdrop data then it is probably claimable.
  claimable: ({ airdrop }: { airdrop?: unknown }) => Boolean(airdrop),
  deprecated: () => ({
    Minerals: 1736467200, // Jan 10th 00:00 UTC
  }),
} as AdapterExport;
