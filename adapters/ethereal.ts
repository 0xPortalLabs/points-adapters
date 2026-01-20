import type { AdapterExport } from "../utils/adapter.ts";

import { checksumAddress } from "viem";

const API_URL = "https://deposit-api.ethereal.trade/v1/account/{address}";

const getPoints = ({ points }: { points: string }) => {
  const divisor = BigInt(1e18);
  const whole = BigInt(points) / divisor;
  const remainder = BigInt(points) % divisor;

  return parseFloat(`${whole}.${remainder.toString().padStart(18, "0")}`);
};

/*
{
  "accounts": [
    {
      "address": "0x4142C8D0319B28b1cbd189E2e98a482999BF030B",
      "blockNumber": "22141820",
      "points": "321681447373127189419",
      "balance": "6024268933621",
      "lastCalculatedAt": "2025-03-29T21:31:44.761Z",
      "assetAddress": "0x90D2af7d622ca3141efA4d8f1F24d86E5974Cc8F"
    },
    {
      "address": "0x4142C8D0319B28b1cbd189E2e98a482999BF030B",
      "blockNumber": "22155289",
      "points": "56388972768965554059391",
      "balance": "93507930597765227586000",
      "lastCalculatedAt": "2025-03-29T21:36:59.000Z",
      "assetAddress": "0x708dD9B344dDc7842f44C7b90492CF0e1E3eb868"
    },
    {
      "address": "0x4142C8D0319B28b1cbd189E2e98a482999BF030B",
      "blockNumber": "22155289",
      "points": "67684684557511913952046",
      "balance": "524116703465475323795553",
      "lastCalculatedAt": "2025-03-29T21:36:59.000Z",
      "assetAddress": "0x85667e484a32d884010Cf16427D90049CCf46e97"
    }
  ],
    "refereeAccounts": [],
    "leaderboardPosition": {
        "address": "0x4142C8D0319B28b1cbd189E2e98a482999BF030B",
        "lastCalculatedAt": "2025-11-10T20:07:35.364Z",
        "rank": 439,
        "totalPoints": "578312831352287139739603"
    },
    "leaderboardPositionS0": {
        "address": "0x4142C8D0319B28b1cbd189E2e98a482999BF030B",
        "lastCalculatedAt": "2025-10-03T23:39:07.162Z",
        "rank": 377,
        "totalPoints": "578312827053433376520606"
    }
}
 */
export default {
  fetch: async (address: string) => {
    address = checksumAddress(address as `0x${string}`);
    const res = await fetch(API_URL.replace("{address}", address), {
      headers: {
          "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
    });

    if (res.status === 404)
      return { accounts: [], leaderboardPosition: { rank: 0 } };

    return await res.json();
  },
  data: ({
    accounts,
    leaderboardPosition,
  }: {
    accounts: Array<{ assetAddress: string; points: string }>;
    leaderboardPosition: { rank: number };
  }) => {
    return {
      rank: leaderboardPosition.rank,
      ...Object.fromEntries(
        accounts.map((account) => [
          `Asset: ${account.assetAddress}`,
          getPoints(account),
        ])
      ),
    };
  },
  total: ({ accounts }: { accounts: Array<{ points: string }> }) =>
    accounts.reduce((total, account) => total + getPoints(account), 0),
  rank: (data: { leaderboardPosition: { rank: number } }) => {
    return data.leaderboardPosition.rank;
  },
} as AdapterExport;
