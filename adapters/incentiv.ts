import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://leaderboard.incentiv.io/xp/{address}",
);

type IncentivXP = {
  address: string;
  account_type: string;
  total_xp: number;
  operations_xp: number;
  badge_xp: number;
  referral_xp: number;
  direct_referral_count: number;
  mystery_box_xp: number;
  campaign_xp?: number;
  mystery_box_cost: number;
  usage_xp: number;
  ecosystem_xp: number;
  community_xp: number;
  season_tier: string;
  rank: number;
  total_operations: number;
  last_updated: string;
};

const emptyResponse = (address: string): IncentivXP => ({
  address,
  account_type: "",
  total_xp: 0,
  operations_xp: 0,
  badge_xp: 0,
  referral_xp: 0,
  direct_referral_count: 0,
  mystery_box_xp: 0,
  campaign_xp: 0,
  mystery_box_cost: 0,
  usage_xp: 0,
  ecosystem_xp: 0,
  community_xp: 0,
  season_tier: "N/A",
  rank: 0,
  total_operations: 0,
  last_updated: "N/A",
});

export default {
  fetch: async (address: string) => {
    const normalizedAddress = getAddress(address).toLowerCase();
    const res = await fetch(API_URL.replace("{address}", normalizedAddress), {
      headers: {
        Accept: "application/json",
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
    });

    if (res.status === 404) return emptyResponse(normalizedAddress);

    if (!res.ok) {
      throw new Error(`Incentiv XP request failed with status ${res.status}`);
    }

    return await res.json() as IncentivXP;
  },
  data: (data: IncentivXP) => ({
    XP: {
      Total: data.total_xp,
      Rank: data.rank,
      "Season Tier": data.season_tier,
      Operations: data.operations_xp,
      Usage: data.usage_xp,
      Badge: data.badge_xp,
      Referral: data.referral_xp,
      "Direct Referrals": data.direct_referral_count,
      "Mystery Box": data.mystery_box_xp,
      Campaign: data.campaign_xp ?? data.ecosystem_xp,
      Community: data.community_xp,
      "Total Operations": data.total_operations,
      "Last Updated": data.last_updated,
    },
  }),
  total: (data: IncentivXP) => ({ XP: data.total_xp }),
  rank: (data: IncentivXP) => data.rank,
  supportedAddressTypes: ["evm"],
} as AdapterExport;
