import type { AdapterExport } from "../utils/adapter.ts";

import { getAddress } from "viem";

import { convertValuesToNormal } from "../utils/object.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

// Working wallet: 0x5Db201AE15f9702f0a0Ff9F00b8c1c18355373d0

// Shape of the json: items is an array of user objects

// {
//   "count": 13171,
//   "items": [
//     {
//       "user": "0x5Db201AE15f9702f0a0Ff9F00b8c1c18355373d0",
//       "swap": {
//         "volumeUsd": 29796864.3355949,
//         "txs": 787,
//         "point": 442533213,
//         "pointPartnerBonuses": {
//           "lifi": 964658
//         }
//       },
//       "bridge": {
//         "volumeUsd": 5811054.67371596,
//         "txs": 21,
//         "point": 72638161
//       },
//       "referral": {
//         "point": 0
//       },
//       "total": {
//         "volumeUsd": 35607919.0093109,
//         "txs": 808,
//         "point": 515171474,
//         "pointPartnerBonuses": {
//           "lifi": 964658
//         }
//       },
//       "offsetPoint": 100
//     },

interface UserData {
  user: string;
  total: {
    volumeUsd: number;
    txs: number;
    point: number;
    pointPartnerBonuses: Record<string, number>;
  };
}

const API_URL = await maybeWrapCORSProxy(
  "https://api.hyperflow.fun/v1/point/leaderboard",
);

export default {
  fetch: async (address: string): Promise<UserData> => {
    address = getAddress(address);

    const response = await fetch(API_URL);
    if (!response.ok)
      throw new Error(
        `Failed to fetch hyperflow data ${await response.text()}`,
      );
    const data = await response.json();

    return data.items.find(
      (user: UserData) => getAddress(user.user) === address,
    );
  },
  data: (data: UserData) => {
    if (!data) return {};

    const { pointPartnerBonuses, ...rest } = data.total;
    const flattened = {
      ...rest,
      ...(pointPartnerBonuses &&
        Object.fromEntries(
          Object.entries(pointPartnerBonuses).map(([k, v]) => [
            `Point Partner Bonuses: ${k}`,
            v,
          ]),
        )),
    };

    return { FlowXP: convertValuesToNormal(flattened) };
  },
  total: (data: UserData) => {
    const points = data ? data.total.point : 0;
    return { FlowXP: points };
  },
} as AdapterExport;
