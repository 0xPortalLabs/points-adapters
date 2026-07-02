import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://portal-admin.genlayer.foundation/api/v1/leaderboard/community/?user_address={address}&profile_context=true",
);

type GenLayerCommunityEntry = {
  address?: string | null;
  user_address?: string | null;
  community_points?: number | null;
  total_points?: number | null;
  contribution_count?: number | null;
  discord_xp?: number | null;
  pending_portal_points?: number | null;
  tracked_portal_points_all_time?: number | null;
  rank?: number | null;
};

type GenLayerCommunityResponse = {
  requested_address: string;
  total_community?: number | null;
  count?: number | null;
  context_results?: GenLayerCommunityEntry[];
  user_rank?: number | null;
  user_total_points?: number | null;
};

const getPoints = (data: GenLayerCommunityResponse): number =>
  Number(data.user_total_points ?? 0) || 0;

const getRank = (data: GenLayerCommunityResponse): number =>
  Number(data.user_rank ?? 0) || 0;

const getUserEntry = (
  data: GenLayerCommunityResponse,
): GenLayerCommunityEntry | undefined =>
  data.context_results?.find((entry) =>
    (entry.user_address ?? entry.address)?.toLowerCase() ===
      data.requested_address
  );

export default {
  fetch: async (address: string) => {
    const normalizedAddress = getAddress(address).toLowerCase();
    const res = await fetch(
      API_URL.replace("{address}", encodeURIComponent(normalizedAddress)),
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
        },
      },
    );

    if (!res.ok) {
      throw new Error(
        `GenLayer community points request failed with status ${res.status}`,
      );
    }

    const data = await res.json() as Omit<
      GenLayerCommunityResponse,
      "requested_address"
    >;

    return {
      requested_address: normalizedAddress,
      ...data,
    };
  },
  data: (data: GenLayerCommunityResponse) => {
    const entry = getUserEntry(data);

    return {
      "Community Points": {
        Points: getPoints(data),
        Rank: getRank(data),
        "Contribution Count": Number(entry?.contribution_count ?? 0) || 0,
        "Discord XP": Number(entry?.discord_xp ?? 0) || 0,
        "Pending Portal Points": Number(entry?.pending_portal_points ?? 0) || 0,
        "Tracked Portal Points":
          Number(entry?.tracked_portal_points_all_time ?? 0) || 0,
        "Total Community": Number(data.total_community ?? data.count ?? 0) ||
          0,
      },
    };
  },
  total: (data: GenLayerCommunityResponse) => ({
    "Community Points": getPoints(data),
  }),
  rank: (data: GenLayerCommunityResponse) => getRank(data),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
