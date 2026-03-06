import type { AdapterExport } from "../utils/adapter.ts";

import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://graphigo.prd.galaxy.eco/query",
);

type API_RESPONSE = {
  addressInfo: {
    userXPLevel: {
      validXP: number;
      level: number;
      levelName: string;
      nextLevelRequiredXP: number;
    };
  };
};

export default {
  fetch: async (address: string): Promise<API_RESPONSE> => {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
      body: JSON.stringify({
        operationName: "AddressInfoXP",
        query:
          "query AddressInfoXP($address: String!) {\n  addressInfo(address: $address) {\n    userXPLevel {\n      validXP\n      level\n      levelName\n      nextLevelRequiredXP\n    }\n    __typename\n  }\n}",
        variables: {
          address,
        },
      }),
    });
    const data = await res.json();
    if (data?.errors) throw new Error(data.errors);

    return data.data;
  },
  data: (data: API_RESPONSE) => {
    const xpLevel = data.addressInfo.userXPLevel;
    return {
      XP: {
        "Valid XP": xpLevel.validXP,
        Level: xpLevel.level,
        "Level Name": xpLevel.levelName,
        "Next Level Required XP": xpLevel.nextLevelRequiredXP,
      },
    };
  },
  total: (data: API_RESPONSE) => ({
    XP: data.addressInfo.userXPLevel.validXP,
  }),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
