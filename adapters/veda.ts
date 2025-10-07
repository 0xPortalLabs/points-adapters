import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://app.veda.tech/api/user-veda-points?userAddress={address}"
);

/* {
  base: { userChainVedaPointsSum: 0, vaults: {} },
  ethereum: {
    userChainVedaPointsSum: 9725.839372611186,
    vaults: {
      "0x657e8C867D8B37dCC18fA4Caead9C45EB088C642": {
        name: "eBTC Bitcoin LRT",
        timestamp: "2025-01-14T01:00:00+00:00",
        totalPoints: 21.40487540482542,
      },
      [...]
    },
  },
  userTotalVedaPointsSum: 9725.839372611186,
} */
export default {
  fetch: async (address: string) => {
    const res = await fetch(API_URL.replace("{address}", address));
    const text = await res.text();
    
    // Handle HTML responses (Cloudflare protection or API changes)
    if (text.startsWith("<!DOCTYPE") || text.startsWith("<html")) {
      return { userTotalVedaPointsSum: 0 };
    }
    
    try {
      const data = JSON.parse(text);
      return data.Response || data;
    } catch (err) {
      console.warn("Failed to parse veda response:", err.message);
      return { userTotalVedaPointsSum: 0 };
    }
  },
  data: (
    data: Record<
      string,
      { vaults: Record<string, { name: string; totalPoints: number }> }
    >
  ) => {
    return Object.fromEntries(
      Object.entries(data).flatMap(([chain, { vaults }]) => {
        if (vaults && typeof vaults === "object") {
          return Object.values(vaults).map(({ name, totalPoints }) => [
            `${chain}#${name}`,
            totalPoints,
          ]);
        }

        return [];
      })
    );
  },
  total: (data: { userTotalVedaPointsSum: number }) =>
    data.userTotalVedaPointsSum,
} as AdapterExport;
