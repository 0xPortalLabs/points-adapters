import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://dappster.fun/api/public/points/{address}",
);

type DappsterResponse = {
  protocol: "Dappster";
  address: string;
  addressType: "evm" | "svm";
  points: number;
  rank: number;
  publicApps: number;
  breakdown: Record<string, number>;
  username: string | null;
  profileUrl: string | null;
};

export default {
  fetch: async (address: string) => {
    const response = await fetch(
      API_URL.replace("{address}", encodeURIComponent(address)),
      {
        headers: {
          "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
        },
      },
    );
    if (!response.ok) {
      throw new Error(`Dappster API returned ${response.status}`);
    }
    return await response.json() as DappsterResponse;
  },
  data: (response: DappsterResponse) => ({
    "Dappster Points": response.points,
    "Public Marketplace dApps": response.publicApps,
    "Creator": response.username || "Unclaimed public username",
    ...Object.fromEntries(
      Object.entries(response.breakdown).map(([chain, points]) => [
        `${chain} dApps`,
        points,
      ]),
    ),
  }),
  total: (response: DappsterResponse) => response.points,
  rank: (response: DappsterResponse) => response.rank,
  supportedAddressTypes: ["evm", "svm"],
} as AdapterExport<DappsterResponse>;
