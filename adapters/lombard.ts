import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";
import { isEmpty } from "lodash-es";

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
  protocol_points_map: Record<string, number>;
  badge_points: number;
  checkin_points: number;
};
export default {
  fetch: async (address: string) => {
    const response = await fetch(API_URL.replace("{address}", address), {
      headers: {
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
    });
    const data = await response.json();
    // API returns an empty object when address doesn't exist
    if (!data || isEmpty(data)) {
      return {
        holding_points: 0,
        protocol_points: 0,
        total: 0,
        protocol_points_map: {},
        badge_points: 0,
        checkin_points: 0,
      };
    }
    return data;
  },
  data: (data: API_RESPONSE) => {
    return {
      "Total Points": data.total,
      "Defi Activities Points": Object.values(
        data.protocol_points_map || {}
      ).reduce((s, v) => s + (Number(v) || 0), 0),
      "Badge Points": data.badge_points,
      "Tap In Points": data.checkin_points,
    };
  },
  total: (data: API_RESPONSE) => data.total,
} as unknown as AdapterExport;
