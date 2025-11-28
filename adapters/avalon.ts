import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

import { startCase } from "lodash-es";
import { getAddress } from "viem";

// NOTE: leaderboard
// GET https://aqwufqzelk.execute-api.us-east-1.amazonaws.com/topUsers

const endpoints = await Promise.all(
  Object.entries({
    Bitlayer: "https://aqwufqzelk.execute-api.us-east-1.amazonaws.com",
    Merlin: "https://vag951tija.execute-api.us-east-1.amazonaws.com",
    Core: "https://fh9k1xdvuc.execute-api.us-east-1.amazonaws.com",
    "BNB Chain": "https://m11erpeja0.execute-api.us-east-1.amazonaws.com",
    Arbitrum: "https://v1sjpuoo02.execute-api.us-east-1.amazonaws.com",
    Scroll: "https://18gx08gsx9.execute-api.us-east-1.amazonaws.com",
    Ethereum: "https://0ist2eymd5.execute-api.us-east-1.amazonaws.com",
    Bob: "https://49mf3lb626.execute-api.us-east-1.amazonaws.com",
    Base: "https://ntubwo4wcc.execute-api.us-east-1.amazonaws.com",
    "B² Network": "https://cudotsujh5.execute-api.us-east-1.amazonaws.com",
    ZetaChain: "https://3tcnmqkktl.execute-api.us-east-1.amazonaws.com",
    IoTeX: "https://yzinj56lt6.execute-api.us-east-1.amazonaws.com",
    Kaia: "https://mu46oc1tt2.execute-api.us-east-1.amazonaws.com",
    Corn: "https://vo19nc0ocf.execute-api.us-east-1.amazonaws.com",
    Sonic: "https://gu6oarmjm6.execute-api.us-east-1.amazonaws.com",
    Duckchain: "https://rni0vomwkf.execute-api.us-east-1.amazonaws.com",
  }).map(async ([k, v]) => [k, await maybeWrapCORSProxy(v)]),
).then(Object.fromEntries);

export default {
  fetch: (address: string) => {
    address = getAddress(address); // toCheckSum()
    return Promise.all(
      Object.entries(endpoints).map(async ([chain, url]) => {
        const res = await fetch(url + `/userPoints?address=${address}`);
        if (!res.ok)
          throw new Error(`Request failed for ${chain}, ${await res.text()}`);
        return { chain, data: await res.json() };
      }),
    );
  },
  data: (
    data: { chain: string; data: Record<string, string | number> }[],
  ): Record<string, string | number> => {
    return Object.fromEntries(
      data.flatMap(({ chain, data }) =>
        Object.entries(data)
          .filter(([key]) => key !== "dummy" && key !== "address")
          .map(([key, value]) => [`${chain}: ${startCase(key)}`, value]),
      ),
    );
  },
  total: (data: { chain: string; data: Record<string, string | number> }[]) => {
    return data.reduce(
      (sum, { data }) =>
        sum + (Number(data?.points) || 0) + (Number(data?.totalPoints) || 0),
      0,
    );
  },
} as AdapterExport;
