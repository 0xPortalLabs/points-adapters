import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://app.avantprotocol.com/api/rewards/merkl/{address}"
);

type CampaignBreakdown = {
  campaignId?: string;
  campaignName?: string;
  amount?: string;
};

type API_RESPONSE = {
  currentAmount?: string;
  dailyIntake?: string;
  dailyIntakeSelf?: string;
  dailyIntakeReferral?: string;
  campaignBreakdown?: CampaignBreakdown[];
};

const toNumber = (value: string | number | undefined): number =>
  Number(value ?? 0) || 0;

export default {
  fetch: async (address: string) => {
    const normalizedAddress = getAddress(address).toLowerCase();
    const res = await fetch(API_URL.replace("{address}", normalizedAddress), {
      headers: {
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
    });

    if (!res.ok) {
      throw new Error(`Avant rewards request failed with status ${res.status}`);
    }

    return await res.json();
  },
  data: (data: API_RESPONSE) => {
    const campaigns = Object.fromEntries(
      (data.campaignBreakdown ?? []).map((campaign) => [
        campaign.campaignName ?? campaign.campaignId ?? "Unknown Campaign",
        toNumber(campaign.amount),
      ])
    );

    return {
      Points: {
        Total: toNumber(data.currentAmount),
        "Daily Intake": toNumber(data.dailyIntake),
        "Daily Intake Self": toNumber(data.dailyIntakeSelf),
        "Daily Intake Referral": toNumber(data.dailyIntakeReferral),
        // Avant's Galxe endpoint only powers fixed social quest eligibility.
        // The ranked points ledger and leaderboard totals match this Merkl total.
        ...campaigns,
      },
    };
  },
  total: (data: API_RESPONSE) => ({
    Points: toNumber(data.currentAmount),
  }),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
