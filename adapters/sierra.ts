import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://app.sierra.money/api/points/ledger?address={address}"
);

type SourceBreakdown = {
  source?: string;
  points?: number;
};

type LedgerEntry = {
  address?: string;
  epoch?: string;
  newBalance?: number;
  previousBalance?: number;
  pointsThisWeek?: number;
  overallRank?: number;
  overallRankChange?: number;
  weeklyRank?: number;
  weeklyRankChange?: number;
  lastUpdated?: number;
  breakdown?: SourceBreakdown[];
};

type API_RESPONSE = {
  epoch?: string;
  metadata?: {
    epoch?: string;
    status?: string;
    weekPointsDistributed?: number;
    totalPointsDistributed?: number;
    uniqueAddresses?: number;
    generatedAt?: number;
  };
  entries?: LedgerEntry[];
};

const getEntry = (data: API_RESPONSE): LedgerEntry => data.entries?.[0] ?? {};

const sourceLabel = (source: SourceBreakdown) =>
  (source.source ?? "Unknown Source").replace(/-\d{4}-W\d{2}$/i, "");

export default {
  fetch: async (address: string) => {
    const res = await fetch(
      API_URL.replace("{address}", getAddress(address).toLowerCase()),
      {
        headers: {
          Accept: "application/json",
          // FIXME: They dont let use `Checkpoint API (https://checkpoint.exchange)` :(
          "User-Agent":
            "Mozilla/5.0 Checkpoint API (https://checkpoint.exchange/) Gecko",
        },
      }
    );

    return await res.json();
  },
  data: (data: API_RESPONSE) => {
    const entry = getEntry(data);
    const sourceBreakdown: Record<string, number> = {};
    for (const source of entry.breakdown ?? []) {
      const label = sourceLabel(source);
      sourceBreakdown[label] =
        (sourceBreakdown[label] ?? 0) + (source.points ?? 0);
    }

    return {
      Peaks: {
        Total: entry.newBalance ?? 0,
        "Previous Balance": entry.previousBalance ?? 0,
        "This Week": entry.pointsThisWeek ?? 0,
        "Overall Rank": entry.overallRank ?? 0,
        "Overall Rank Change": entry.overallRankChange ?? 0,
        "Weekly Rank": entry.weeklyRank ?? 0,
        "Weekly Rank Change": entry.weeklyRankChange ?? 0,
        Epoch: entry.epoch ?? data.epoch ?? "",
        ...sourceBreakdown,
      },
      Program: {
        Epoch: data.metadata?.epoch ?? data.epoch ?? "",
        Status: data.metadata?.status ?? "",
        "Week Points Distributed": data.metadata?.weekPointsDistributed ?? 0,
        "Total Points Distributed": data.metadata?.totalPointsDistributed ?? 0,
        "Unique Addresses": data.metadata?.uniqueAddresses ?? 0,
      },
    };
  },
  total: (data: API_RESPONSE) => ({
    Peaks: getEntry(data).newBalance ?? 0,
  }),
  rank: (data: API_RESPONSE) => getEntry(data).overallRank ?? 0,
  supportedAddressTypes: ["evm"],
} as AdapterExport;
