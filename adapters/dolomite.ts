import type { AdapterExport } from "../utils/adapter.ts";

import { checksumAddress } from "viem";

import { maybeWrapCORSProxy } from "../utils/cors.ts";

const AIRDROP_URL = await maybeWrapCORSProxy(
  "https://api.dolomite.io/airdrop/regular/{address}",
);

export default {
  fetch: async (address: string) => {
    address = checksumAddress(address as `0x${string}`);

    const res = await fetch(AIRDROP_URL.replace("{address}", address));
    if (!res.ok)
      throw new Error(`Failed to fetch dolomite data ${await res.text()}`);
    const milestones = await res.json();
    return milestones;
  },
  data: ({
    airdrop,
  }: {
    airdrop?: { amount: string; level_snapshot: number | null };
  }) => {
    return {
      Minerals: {
        "Airdrop Amount": airdrop ? parseFloat(airdrop.amount) || 0 : 0,
        "Level Snapshot": airdrop?.level_snapshot || 0,
      },
    };
  },
  total: ({ airdrop }: { airdrop?: { amount: string } }) => ({
    Minerals: airdrop ? parseFloat(airdrop.amount) || 0 : 0,
  }),
  // If they have airdrop data then it is probably claimable.
  claimable: ({ airdrop }: { airdrop?: unknown }) => Boolean(airdrop),
  deprecated: () => ({
    Minerals: 1736467200, // Jan 10th 00:00 UTC
  }),
} as AdapterExport;
