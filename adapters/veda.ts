import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://app.veda.tech/api/user-veda-points?userAddress={address}",
);

type ChainPoints = {
  vaults: Record<string, { name: string; totalPoints: number }>;
};

type API_RESPONSE = {
  userTotalVedaPointsSum: number;
} & Record<string, ChainPoints | number>;

const emptyResponse = (): API_RESPONSE => ({
  userTotalVedaPointsSum: 0,
});

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
  fetch: async (address: string): Promise<API_RESPONSE> => {
    const res = await fetch(API_URL.replace("{address}", address), {
      headers: {
        Accept: "application/json",
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
    });

    if (!res.ok) {
      throw new Error(`Veda points request failed with status ${res.status}`);
    }

    const data = await res.json() as {
      Response?: API_RESPONSE;
      error?: string;
    };
    if (data.error) {
      throw new Error(`Veda points request returned error: ${data.error}`);
    }

    return data.Response ?? emptyResponse();
  },
  data: (data: API_RESPONSE) => {
    return Object.fromEntries(
      Object.entries(data).flatMap(([chain, chainData]) => {
        if (
          chainData &&
          typeof chainData === "object" &&
          !Array.isArray(chainData) &&
          "vaults" in chainData &&
          chainData.vaults &&
          typeof chainData.vaults === "object"
        ) {
          return Object.values(chainData.vaults).map((
            { name, totalPoints },
          ) => [
            `${chain}#${name}`,
            totalPoints,
          ]);
        }

        return [];
      }),
    );
  },
  total: (data: API_RESPONSE) => data.userTotalVedaPointsSum,
  supportedAddressTypes: ["evm"],
} as AdapterExport;
