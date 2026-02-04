import type { AdapterExport } from "../utils/adapter";
import { maybeWrapCORSProxy } from "../utils/cors.ts";
import { convertKeysToStartCase } from "../utils/object.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://api.usd.ai/usdai/wallet/{address}"
);

// 0xa67963e047cf23aa96a178f434f678a6a3a537e9
type API_RESPONSE = {
  xpState: {
    xp: Record<string, number>;
    totalXp: number;
    icoXp: number;
    airdropXp: number;
    noAlignmentXp: number;
    inviteXp: number;
    qualifiedWallets: number;
    rank: number;
    alignment: string;
    alignmentPercentage: number;
  };
};
export default {
  fetch: async (address) => {
    const res = await fetch(API_URL.replace("{address}", address), {
      headers: {
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
    });
    const data = await res.json();
    if (data.message === "Wallet not found") {
      return {
        xpState: {
          xp: {},
          totalXp: 0,
          icoXp: 0,
          airdropXp: 0,
          noAlignmentXp: 0,
          inviteXp: 0,
          qualifiedWallets: 0,
          rank: 0,
          alignment: "",
          alignmentPercentage: 0,
        },
      };
    }
    return data;
  },
  data: ({ xpState }: API_RESPONSE) => {
    return {
      ...convertKeysToStartCase({
        ...xpState.xp,
        totalXp: xpState.totalXp,
        icoXp: xpState.icoXp,
        noAlignmentXp: xpState.noAlignmentXp,
        inviteXp: xpState.inviteXp,
        qualifiedWallets: xpState.qualifiedWallets,
        rank: xpState.rank,
        alignment: xpState.alignment,
        alignmentPercentage: xpState.alignmentPercentage,
      }),
    };
  },
  total: (data: API_RESPONSE) => ({
    XP: data.xpState.totalXp,
  }),
  rank: (data: API_RESPONSE) => data.xpState.rank,
} as AdapterExport;
