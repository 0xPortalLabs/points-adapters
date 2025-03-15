import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy("https://sft-api.com/graphql");
// Simply just btoa('undefined||undefined||undefined||') + '.undefined'
const API_KEY = "dW5kZWZpbmVkfHx1bmRlZmluZWR8fHVuZGVmaW5lZHx8.undefined";

const req = {
  operationName: "Phase2PointSysAccountInfo",
  variables: { address: "" },
  query: `
query Phase2PointSysAccountInfo($address: String) {
    phase2PointSysAccountInfo(address: $address) {
        isRegistered
        seedUserInviteCode
        inviteCode
        inviteCount
        totalPointsEarned
        availablePoints
        isPointsAccelerationActive
        todayHoldingTVL
        todayHoldingAccelerationRatio
        nextLevelHoldingTVL
        nextLevelHoldingAccelerationRatio
        activityCards {
            type
            accelerationRatio
            startTime
            endTime
        }
        isHighestLevel
    }
}`,
};

/*
{
  isRegistered: true,
  seedUserInviteCode: null,
  inviteCode: "W4YQX8",
  inviteCount: 6,
  totalPointsEarned: "1273299.77349315227129452",
  availablePoints: "1273299.77349315227129452",
  isPointsAccelerationActive: false,
  todayHoldingTVL: "53.49040374063084533009",
  todayHoldingAccelerationRatio: "0",
  nextLevelHoldingTVL: "0",
  nextLevelHoldingAccelerationRatio: "0",
  activityCards: [],
  isHighestLevel: false
}
 */
export default {
  fetch: async (address: string) => {
    req.variables.address = address;

    const res = await (
      await fetch(API_URL.replace("{address}", address), {
        method: "POST",
        body: JSON.stringify(req),
        headers: {
          Authorization: API_KEY,
        },
      })
    ).json();
    return res.data.phase2PointSysAccountInfo;
  },
  data: (data: Record<string, number | string>) => {
    return Object.fromEntries(
      Object.entries(data)
        .filter(([_, v]) => !Number.isNaN(parseFloat(String(v))))
        .map(([k, v]) => [k, Number(v)])
    );
  },
  total: (data: Record<string, string>) => parseFloat(data.totalPointsEarned),
} as AdapterExport;
