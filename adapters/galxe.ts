import type { AdapterExport } from "../utils/adapter.ts";

import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://graphigo.prd.galaxy.eco/query"
);

type API_RESPONSE = {
  addressInfo: {
    username: string;
    userXPLevel: {
      validXP: number;
      level: number;
      levelName: string;
    };
  };
};

const userNotFound = (data: API_RESPONSE) => data.addressInfo.username === "";

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
          "query AddressInfoXP($address: String!) {\n  addressInfo(address: $address) {\n    username\n    userXPLevel {\n      validXP\n      level\n      levelName\n    }\n  }\n}",
        variables: {
          address,
        },
      }),
    });
    const data = await res.json();
    if (data?.errors) throw new Error(JSON.stringify(data.errors));

    return data.data;
  },
  data: (data: API_RESPONSE) => {
    if (userNotFound(data)) {
      return {
        XP: {
          "Valid XP": 0,
          Level: 0,
          "Level Name": "N/A",
        },
      };
    }

    const xpLevel = data.addressInfo.userXPLevel;
    return {
      XP: {
        "Valid XP": xpLevel.validXP,
        Level: xpLevel.level,
        "Level Name": xpLevel.levelName,
      },
    };
  },
  total: (data: API_RESPONSE) => ({
    XP: userNotFound(data) ? 0 : data.addressInfo.userXPLevel.validXP,
  }),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
