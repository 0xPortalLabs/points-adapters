import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const POINTS_URL = await maybeWrapCORSProxy(
  "https://api-points.silo.finance/points/userpoints?account={address}"
);
const LEADERBOARD_URL = await maybeWrapCORSProxy(
  "https://api-points.silo.finance/points/leaderboard?account={address}"
);

/**
{
  topAccounts: [
    {
      points: 1561433924.937687,
      address: "0xceaeab74d8dd1688640c463c20c8d7ea3994e177",
      position: 1,
    },
    {
      points: 1285248658.687515,
      address: "0x431e81e5dfb5a24541b5ff8762bdef3f32f96354",
      position: 2,
    },
    {
      points: 939406603.93684,
      address: "0x2ae08196c5323f5cd1a792de2124914ff4704e03",
      position: 3,
    },
    {
      points: 502.22421864787,
      address: "0xf4fe75926d607d43b074f8de38a49258773090f7",
      position: 8746,
    },
  ],
  total: 11151,
};
*/
// {"account":"0xf4fe75926d607d43b074f8de38a49258773090f7","userPoints":502.22421864787,"totalPoints":26484612396.44205}
export default {
  fetch: async (address: string) => {
    const [points, leaderboard] = await Promise.all([
      (await fetch(POINTS_URL.replace("{address}", address))).json(),
      (await fetch(LEADERBOARD_URL.replace("{address}", address))).json(),
    ]);

    const position =
      leaderboard.topAccounts.find(
        (x: { address: string }) =>
          x.address.toLowerCase() === address.toLowerCase()
      )?.position ?? 0;

    return { points, position };
  },
  data: ({
    points,
  }: {
    points: { userPoints: number; totalPoints: number };
  }) => ({
    userPoints: points.userPoints,
    totalPoints: points.totalPoints,
  }),
  total: ({ points }: { points: { userPoints: number } }) => points.userPoints,
  rank: ({ position }: { position: number }) => position,
} as AdapterExport;
