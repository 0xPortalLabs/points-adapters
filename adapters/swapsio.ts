import type { AdapterExport } from "../utils/adapter.ts";

import {
  convertKeysToStartCase,
  convertValuesToNormal,
} from "../utils/object.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://explorer.prod.swaps.io/api/v0/users/{address}"
);

/*
{
  address: "0x..",
  volume: "230691",
  swaps_count: 21,
  fees: "211",
  rank: 20,
  rewards_total: [{ id: "points", amount: "2536" }],
}
*/
export default {
  fetch: async (address: string) => {
    return (await fetch(API_URL.replace("{address}", address), {})).json();
  },
  data: (
    data: { rewards_total?: Array<{ id: string; amount: string }> } & Record<
      string,
      number | string
    >
  ) => {
    const { address: _x, rewards_total, ...rest } = data;
    const rewards =
      rewards_total?.reduce(
        (acc, reward) => {
          acc[reward.id] = parseFloat(reward.amount);
          return acc;
        },
        {} as Record<string, number>
      ) || {};

    return convertKeysToStartCase(
      convertValuesToNormal({ ...rest, ...rewards })
    );
  },
  total: (data: { rewards_total?: Array<{ id: string; amount: string }> }) => {
    const x = data?.rewards_total?.find((r) => r.id === "points");
    return x ? parseFloat(x.amount) : 0;
  },
  rank: (data: { rank: number }) => data.rank,
} as AdapterExport;
