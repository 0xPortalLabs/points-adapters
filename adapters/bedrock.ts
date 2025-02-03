import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";
import { convertValuesToNormal } from "../utils/object.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://app.bedrock.technology/api/v2/bedrock/third-protocol/points"
);

/*
{
  balance: "1562957.092",
  kernelsPerSec: "3.974207",
  kernelsPerBlock: "0.000000",
  turbo: "1.000000",
}
 */
export default {
  fetch: async (address: string) => {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ address }),
    });
    return (await res.json()).data;
  },
  points: (data: Record<string, string>) => {
    const { address: _address, ...rest } = data;
    return convertValuesToNormal(rest);
  },
  total: (data: Record<string, string>) => parseFloat(data.totalPoint) || 0,
} as AdapterExport;
