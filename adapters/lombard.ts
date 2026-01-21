import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";
import { startCase } from "lodash-es";

const API_URL = await maybeWrapCORSProxy(
  "https://mainnet.prod.lombard.finance/api/v1/referral-system/season-2/points/{address}"
);

// {
//     "holding_points": 0.015005404,
//     "protocol_points": 21.982641,
//     "total": 1921.9977,
//     "protocol_points_map": {
//         "lombard-holding-points-eth": 0.015005404,
//         "lombard-sonic-vault-eth": 21.982641
//     },
//     "badge_points": 1500,
//     "checkin_points": 400
// }
type API_RESPONSE = {
  holding_points: number;
  protocol_points: number;
  total: number;
  protocol_points_map: {
    "lombard-holding-points-eth": number;
    "lombard-sonic-vault-eth": number;
  };
  badge_points: number;
  checkin_points: number;
};
export default {
  fetch: async (address: string) => {
    const response = await fetch(API_URL.replace("{address}", address), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    return await response.json();
  },
  data: (data: API_RESPONSE) => ({
    "Total Points": data.total,
    "Defi Activities Points":
      data.protocol_points_map["lombard-holding-points-eth"] +
      data.protocol_points_map["lombard-sonic-vault-eth"],
    "Badge Points": data.badge_points,
    "Tap In Points": data.checkin_points,
  }),
  total: (data: API_RESPONSE) => data.total,
} as AdapterExport;
