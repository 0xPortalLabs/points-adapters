import type { AdapterExport } from "../utils/adapter.ts";

const API_URL =
  "https://app.veda.tech/api/user-veda-points?userAddress={address}";

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
    return (await (await fetch(API_URL.replace("{address}", address))).json())
      .Response;
  },
  points: (
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
