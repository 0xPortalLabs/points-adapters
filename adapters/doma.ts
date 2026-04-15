import { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";
import { getAddress } from "viem";
import { convertKeysToStartCase } from "../utils/object.ts";

const API_URL = await maybeWrapCORSProxy("https://api.doma.xyz/graphql");

export default {
  fetch: async (address) => {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
        "Content-Type": "application/json",
        "Api-key":
          "v1.c6e3f41019fb97237b7f192d49adb2ae464f2ba7ca6c0737fd6eab71ee01d1d4",
      },
      body: JSON.stringify({
        query:
          "query LeaderboardByAddress($walletAddress: AddressCAIP10!, $weekNumber: Int, $season: LeaderboardSeason, $scope: LeaderboardScope) {  leaderboard(    walletAddress: $walletAddress    weekNumber: $weekNumber    season: $season    scope: $scope  ) {    points    rank    referralCount    referralPoints    referralBonusLimit    referralBonusesAwarded    tradingVolumeUsd    walletAddress    totalEntries    weekNumber    currentLevelThreshold    level    nextLevel    userMultiplier    nextThreshold    pointsMultiplier    closingDomaLevel    bonusPointsAwarded    seasonPoints    pointsByType {      TRADING      REFERRAL      QUEST      LEVEL_UP_BONUS      WEEKLY_REWARD      SNAPSHOT    }  }}",
        variables: {
          walletAddress: `eip155:_:${getAddress(address)}`,
        },
      }),
    });
    return (await res.json()).data;
  },
  data: (data: { leaderboard: Record<string, number | string> }) => {
    const { walletAddress, ...rest } = data.leaderboard;
    return convertKeysToStartCase(rest);
  },
  total: (data: { leaderboard: Record<string, number | string> }) =>
    data.leaderboard.points,
  rank: (data: { leaderboard: Record<string, number | string> }) =>
    data.leaderboard.rank,
  // TODO: The API supports SVM but cant find any SVM addresses in their leaderboard.
  supportedAddressTypes: ["evm"],
} as AdapterExport;
