import { maybeWrapCORSProxy } from "../utils/cors.ts";
import type { AdapterExport } from "../utils/adapter.ts";
import { getAddress } from "viem";

const API_URL = await maybeWrapCORSProxy(
  "https://linera-api.pulsar.money/api/v1/pulsar/challenges/linera/leaderboard/1?limit=241000",
);

//{
//    "count": 242070,
//    "data": [
//        {
//            "address": "0x7656d51469Cc95566DCe937e5223508a5Ce03d6b",
//            "campaignId": "linera",
//            "campaignGroup": "1",
//            "totalPoints": "1247.000000",
//            "rank": 1,
//            "isVerified": false,
//            "hasPremiumSubscription": false,
//            "name": "Scrolalds"
//        },
//        {
//            "address": "0x44fd911b38b2916c6a995D3712c422EA2441397E",
//            "campaignId": "linera",
//            "campaignGroup": "1",
//            "totalPoints": "1217.000000",
//            "rank": 2,
//            "isVerified": false,
//            "hasPremiumSubscription": false,
//            "name": "levon"
//        },

type API_RESPONSE = {
  address: string;
  campaignGroup: string;
  totalPoints: string;
  rank: number;
  isVerified: boolean;
  hasPremiumSubscription: boolean;
  name: string;
};

export default {
  fetch: async (address) => {
    const res = await fetch(API_URL);
    const data = await res.json();
    return (
      data.data.find(
        (item: API_RESPONSE) =>
          getAddress(item.address) === getAddress(address),
      ) ?? { totalPoints: "0", rank: 0 }
    );
  },
  data: (data: API_RESPONSE) => {
    return {
      "Campaign Group": data.campaignGroup,
      "Total Points": data.totalPoints,
      Rank: data.rank,
      Verified: data.isVerified ? "Yes" : "No",
      "Premium Subscription": data.hasPremiumSubscription ? "Yes" : "No",
      Name: data.name,
    };
  },
  total: (data: API_RESPONSE) => Number(data.totalPoints),
  rank: (data: API_RESPONSE) => data.rank,
} as AdapterExport;
