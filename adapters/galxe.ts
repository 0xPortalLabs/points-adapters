import { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

// { api returns something like this but they use graphql so you can adjust the query
//     "data": {
//         "addressInfo": {
//             "id": "meDis7ASYQKSTs5yLAWrHL",
//             "username": "evxlution",
//             "avatar": "https://api.galxe.com/v1/avatar?size=120&variant=marble&name=0xff0f3ccbcbb92ddaf98613a9a905bd71854e7a20",
//             "address": "0xff0f3ccbcbb92ddaf98613a9a905bd71854e7a20",
//             "evmAddressSecondary": null,
//             "userLevel": {
//                 "level": {
//                     "name": "Lv1",
//                     "logo": "https://cdn.galxe.com/galaxy/54f29c5a1a564e618fbda02222dc2b11/.png_thumbnail.webp",
//                     "minExp": 0,
//                     "maxExp": 152,
//                     "value": 1,
//                     "__typename": "Level"
//                 },
//                 "exp": 0,
//                 "gold": 0,
//                 "ggRecall": false,
//                 "__typename": "UserLevel"
//             },

const API_URL = await maybeWrapCORSProxy(
  "https://graphigo.prd.galaxy.eco/query",
);

type API_RESPONSE = {
  data: {
    addressInfo: {
      username: string;
      userLevel: {
        level: { value: number; minExp: string; maxExp: string };
        exp: number;
        gold: number;
      };
    };
  };
};
export default {
  fetch: async (address) => {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        operationName: "BasicUserInfo",
        query:
          "query BasicUserInfo($address: String!) {\n  addressInfo(address: $address) {\n    username\n    userLevel {\n      level {\n        value\n      }\n      exp\n      gold\n    }\n  }\n}",
        variables: {
          address,
        },
      }),
    });
    return await res.json();
  },
  data: (data: API_RESPONSE) => {
    const gold = data.data.addressInfo.userLevel.gold;
    const level = data.data.addressInfo.userLevel.level.value;
    return {
      Username: data.data.addressInfo.username,
      Level: level,
      Experience: data.data.addressInfo.userLevel.exp,
      Gold: gold === 81991 && level === 1 ? 0 : gold,
    };
  },
  total: (data: API_RESPONSE) => {
    const gold = data.data.addressInfo.userLevel.gold;
    const level = data.data.addressInfo.userLevel.level.value;
    // really weird thing where accounts that dont exist return 81991 for gold when it is actually 0
    if (gold === 81991 && level === 1) return 0;
    return {
      Gold: gold,
    };
  },
  rank: (data: API_RESPONSE) => data.data.addressInfo.userLevel.level.value,
} as AdapterExport;
