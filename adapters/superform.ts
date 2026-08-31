import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const FTB_LEADERBOARD_URL = await maybeWrapCORSProxy(
  "https://app.superform.xyz/api/leaderboard",
);

type FTBLeaderboardEntry = {
  wallet_address: string;
  tier: string;
  tvl_usd: number;
  up_usd: number;
  approved_count: number;
  pending_count: number;
  content_points: number;
  quest_points: number;
  governance_points: number;
  achievement_points: number;
  base_points: number;
  tier_multiplier: number;
  boosted_score: number;
  rank: number;
};

type API_RESPONSE = {
  entry?: FTBLeaderboardEntry;
};

const isLeaderboardEntry = (value: unknown): value is FTBLeaderboardEntry => {
  if (!value || typeof value !== "object") return false;

  const entry = value as Record<string, unknown>;
  const numericKeys = [
    "tvl_usd",
    "up_usd",
    "approved_count",
    "pending_count",
    "content_points",
    "quest_points",
    "governance_points",
    "achievement_points",
    "base_points",
    "tier_multiplier",
    "boosted_score",
    "rank",
  ];

  return typeof entry.wallet_address === "string" &&
    typeof entry.tier === "string" &&
    numericKeys.every((key) => {
      const numericValue = entry[key];
      return typeof numericValue === "number" &&
        Number.isFinite(numericValue);
    });
};

export default {
  fetch: async (address: string): Promise<API_RESPONSE> => {
    const res = await fetch(FTB_LEADERBOARD_URL, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
    });

    if (!res.ok) {
      throw new Error(
        `Superform FTB leaderboard request failed with status ${res.status}`,
      );
    }

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      throw new Error("Superform FTB leaderboard returned invalid JSON");
    }

    if (!Array.isArray(data)) {
      throw new Error(
        "Superform FTB leaderboard returned a malformed response",
      );
    }

    const normalizedAddress = address.toLowerCase();
    const entry = data.find((value) => {
      if (!value || typeof value !== "object") return false;
      const walletAddress = (value as Record<string, unknown>).wallet_address;
      return typeof walletAddress === "string" &&
        walletAddress.toLowerCase() === normalizedAddress;
    });

    if (entry === undefined) return {};
    if (!isLeaderboardEntry(entry)) {
      throw new Error(
        "Superform FTB leaderboard returned malformed data for the wallet",
      );
    }

    return { entry };
  },
  data: ({ entry }: API_RESPONSE) => ({
    "FTB Points": entry?.boosted_score ?? 0,
    "Base Points": entry?.base_points ?? 0,
    "Content Points": entry?.content_points ?? 0,
    "Quest Points": entry?.quest_points ?? 0,
    "Governance Points": entry?.governance_points ?? 0,
    "Achievement Points": entry?.achievement_points ?? 0,
    "Tier Multiplier": entry?.tier_multiplier ?? 0,
    Tier: entry?.tier ?? "Unranked",
    Rank: entry?.rank ?? 0,
    "TVL USD": entry?.tvl_usd ?? 0,
    "sUP USD": entry?.up_usd ?? 0,
    "Approved Submissions": entry?.approved_count ?? 0,
    "Pending Submissions": entry?.pending_count ?? 0,
  }),
  total: ({ entry }: API_RESPONSE) => ({
    "FTB Points": entry?.boosted_score ?? 0,
  }),
  rank: ({ entry }: API_RESPONSE) => entry?.rank ?? 0,
  deprecated: () => ({
    "S3 Points": 1780876800, // June 8th 2026 00:00 UTC
  }),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
