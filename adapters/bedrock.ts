import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";
import {
  convertKeysToStartCase,
  convertValuesToNormal,
} from "../utils/object.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://app.bedrock.technology/api/v2/bedrock/third-protocol/points",
);

export default {
  fetch: async (address: string) => {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ address: address.toLowerCase() }),
    });
    if (!res.ok)
      throw new Error(`Failed to fetch bedrock data ${await res.text()}`);
    return (await res.json()).data;
  },
  data: (data: Record<string, string>) => {
    const { address: _address, ...rest } = data;
    return { Diamonds: convertKeysToStartCase(convertValuesToNormal(rest)) };
  },
  total: (data: Record<string, string>) => ({
    Diamonds: parseFloat(data.totalPoint) || 0,
  }),
} as AdapterExport;
