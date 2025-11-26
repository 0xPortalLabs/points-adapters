import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";
import { convertKeysToStartCase } from "../utils/object.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://app.renzoprotocol.com/api/points/{address}",
);

type API_RESPONSE = {
  totals: {
    renzoPoints: number;
    eigenLayerPoints: number;
    mellowPoints: number;
    symbioticPoints: number;
  };
};
export default {
  fetch: async (address) => {
    const res = await fetch(API_URL.replace("{address}", getAddress(address)));
    const data = await res.json();
    if (data.success) return data.data;
  },
  data: (data: API_RESPONSE) => convertKeysToStartCase(data.totals),
  total: (data: API_RESPONSE) =>
    Object.values(data.totals).reduce((acc, cur) => acc + cur),
} as AdapterExport;
