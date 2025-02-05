import type { AdapterExport } from "../utils/adapter.ts";
import { convertValuesToNormal } from "../utils/object.ts";

const API_URL = "https://api.treehouse.finance/rewards/?address={address}";

/* {
  ARB_TETH: "137.8735037",
  ARB_WST_BALANCER: "0",
  CMETH: "0",
  GTETH: "0",
  TETH: "53.83330315",
  WEETH_CURVE: "0",
  WST_BALANCER: "0",
  WST_CURVE: "0",
  total: "191.7068069",
} */
export default {
  fetch: async (address: string) => {
    return (await fetch(API_URL.replace("{address}", address))).json();
  },
  points: (data: Record<string, string>) => convertValuesToNormal(data),
  total: (data: Record<string, string>) => parseFloat(data.total),
} as AdapterExport;
