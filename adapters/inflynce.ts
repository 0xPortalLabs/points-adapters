import type { AdapterExport } from "../utils/adapter.ts";
import { getFidFromCustodyAddress } from "../utils/farcaster.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";
import { getAddress } from "viem";

const API_URL = await maybeWrapCORSProxy(
  "https://miniapp.inflynce.com/api/graphql"
);

export default {
  fetch: async (address) => {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
      body: JSON.stringify({
        operationName: "GetPointsByFid",
        query:
          "query GetPointsByFid($fid: String!) {user_points_by_pk(fid: $fid) {fid totalPoints} }",
        variables: { fid: await getFidFromCustodyAddress(getAddress(address)) },
      }),
    });
    const data = (await res.json()).data.user_points_by_pk;
    return data ?? { totalPoints: 0 };
  },
  data: (data: { totalPoints: number }) => ({
    IP: data.totalPoints,
  }),
  total: (data: { totalPoints: number }) => ({ IP: data.totalPoints }),
} as AdapterExport;
