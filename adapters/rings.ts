import type { AdapterExport } from "../utils/adapter.ts";
import {
  convertKeysToStartCase,
  convertValuesToNormal,
} from "../utils/object.ts";

import { getAddress } from "viem";

const API_URL = "https://points-api-s2.rings.money/points/{address}";

// NOTE: leaderboard api
// https://points-api.rings.money/points/leaderboard?limit=10&offset=10

/*
{
  user: "0xCe39D66872015a8d1B2070725E6BFc687A418bD0",
  totalByType: {
    beets: "0",
    "holding-usd": "0",
    "staking-usd": "0",
    "wrapped-staking-usd": "0",
    "locking-usd": "0",
    "holding-eth": "405830681631154958390446945170360430320000000",
    "staking-eth": "0",
    "wrapped-staking-eth": "0",
    "locking-eth": "0",
    "holding-btc": "0",
    "staking-btc": "0",
    "wrapped-staking-btc": "0",
    "locking-btc": "0",
    referral: "0",
  },
  pointsByPeriods: {
    [...]
    "1": {
      points: "145006982219742707287853816834344368000000",
      pointsByType: {
        beets: "0",
        "holding-usd": "0",
        "staking-usd": "0",
        "wrapped-staking-usd": "0",
        "locking-usd": "0",
        "holding-eth": "145006982219742707287853816834344368000000",
        "staking-eth": "0",
        "wrapped-staking-eth": "0",
        "locking-eth": "0",
        "holding-btc": "0",
        "staking-btc": "0",
        "wrapped-staking-btc": "0",
        "locking-btc": "0",
        referral: "0",
      },
    },
    [...]
  },
  total: "405830681631154958390446945170360430320000000",
};
*/
export default {
  fetch: async (address: string) => {
    address = getAddress(address);
    return (
      await fetch(API_URL.replace("{address}", address), {
        headers: {
          "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
        },
      })
    ).json();
  },
  data: (data: { totalByType: Record<string, string> }) =>
    convertKeysToStartCase(
      convertValuesToNormal(
        Object.fromEntries(
          Object.entries(data.totalByType).map(([key, value]) => [
            key,
            Number(BigInt(value) / BigInt(1e36)),
          ])
        )
      )
    ),
  total: (data: { total: string }) => Number(BigInt(data.total) / BigInt(1e36)),
} as AdapterExport;
