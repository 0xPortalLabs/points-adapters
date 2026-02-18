import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";
import { formatUnits } from "viem";

const API_URL = await maybeWrapCORSProxy(
  "https://api.merkl.xyz/v4/users/{address}/rewards?chainId=4326",
);
const TARGET_CAMPAIGN_ID =
  "0x87e072080ececb16794e8184b2fad18d4f5507cccd46cdc84b9860f93ec29dc9";

type MerklResponse = {
  chain?: { name?: string };
  rewards?: {
    token?: { decimals?: number; symbol?: string };
    breakdowns?: {
      campaignId?: string;
      amount?: string;
      claimed?: string;
      pending?: string;
    }[];
  }[];
}[];

const toBigInt = (value?: string) => {
  try {
    return BigInt(value ?? "0");
  } catch {
    return 0n;
  }
};

const getCampaignStats = (data: MerklResponse) => {
  let label = "Avon Points";
  let decimals = 18;
  let amount = 0n;
  let claimed = 0n;
  let pending = 0n;
  let campaignCount = 0;

  for (const { rewards = [] } of data) {
    for (const reward of rewards) {
      for (const breakdown of reward.breakdowns ?? []) {
        if (breakdown.campaignId?.toLowerCase() !== TARGET_CAMPAIGN_ID) {
          continue;
        }

        amount += toBigInt(breakdown.amount);
        claimed += toBigInt(breakdown.claimed);
        pending += toBigInt(breakdown.pending);
        campaignCount += 1;
        label = reward.token?.symbol ?? label;
        decimals = reward.token?.decimals ?? decimals;
      }
    }
  }

  return {
    label,
    decimals,
    amount,
    claimed,
    pending,
    campaignCount,
    chain: data[0]?.chain?.name ?? "Megaeth",
  };
};

export default {
  fetch: async (address: string) => {
    const res = await fetch(
      API_URL.replace("{address}", address.toLowerCase()),
      {
        headers: {
          "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
        },
      },
    );
    return await res.json();
  },
  data: (data: MerklResponse) => {
    const normalized = getCampaignStats(data);
    return {
      [normalized.label]: {
        Chain: normalized.chain,
        "Total Earned": parseFloat(
          formatUnits(normalized.amount, normalized.decimals),
        ),
        Pending: parseFloat(
          formatUnits(normalized.pending, normalized.decimals),
        ),
        Claimed: parseFloat(
          formatUnits(normalized.claimed, normalized.decimals),
        ),
        Campaigns: normalized.campaignCount,
      },
    };
  },
  total: (data: MerklResponse) => {
    const normalized = getCampaignStats(data);
    return {
      [normalized.label]: parseFloat(
        formatUnits(normalized.amount, normalized.decimals),
      ),
    };
  },
  claimable: (data: MerklResponse) => getCampaignStats(data).pending > 0n,
  supportedAddressTypes: ["evm"],
} as AdapterExport;
