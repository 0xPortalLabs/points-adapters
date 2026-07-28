import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://ondo.foundation/api/my_points?address={address}",
);

type OndoPointsResponse = {
  hip3TraderPoints?: string;
  perpsPoints?: string;
  totalPoints?: string;
  participatingCampaigns?: number;
  rank?: number | null;
  updatedAt?: string;
};

const toNumber = (value: string | number | undefined): number =>
  Number(value ?? 0) || 0;

export default {
  fetch: async (address: string) => {
    const res = await fetch(
      API_URL.replace("{address}", address.toLowerCase()),
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
        },
      },
    );

    if (!res.ok) {
      throw new Error(`Ondo points request failed with status ${res.status}`);
    }

    return await res.json() as OndoPointsResponse;
  },
  data: (data: OndoPointsResponse) => ({
    "Ondo Points": {
      Total: toNumber(data.totalPoints),
      "Ondo Perps Points": toNumber(data.perpsPoints),
      "HIP-3 Trader Points": toNumber(data.hip3TraderPoints),
      "Participating Campaigns": Number(data.participatingCampaigns ?? 0),
      "Global Rank": Number(data.rank ?? 0),
      "Last Updated": data.updatedAt ?? "N/A",
    },
  }),
  total: (data: OndoPointsResponse) => ({
    "Ondo Points": toNumber(data.totalPoints),
  }),
  rank: (data: OndoPointsResponse) => Number(data.rank ?? 0),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
