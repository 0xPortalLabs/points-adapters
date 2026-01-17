import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";
import { startCase } from "lodash-es";

const API_URL = await maybeWrapCORSProxy(
  "https://bff.prod.lombard.finance/sentio-api/lombard-points/{address}");

/*
 * [{
 *   account:	"0x3c2..."
 *   points_json:	'{"lombard-etherfi-ethereum":{"bpoints":0,"lpoints":15.199198466659,"ebtc_balance":0,"multiplier":2}}'
 * }]
 */
export default {
  fetch: async (address: string) => {
    const response = await fetch(API_URL.replace("{address}", address), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    return (await response.json()).result.rows;
  },
  data: (data: { points_json: string }[]) => {
    if (data.length > 0) {
      const parsed = JSON.parse(data[0].points_json);
      return Object.fromEntries(
        Object.entries(parsed).flatMap(([cat, x]) =>
          Object.entries(x as Record<string, number>).map(([k, v]) => {
            return [`${startCase(cat)}: ${startCase(k)}`, v];
          })
        )
      );
    }

    return {};
  },
  total: (data: { points_json: string }[]) => {
    if (data.length > 0) {
      const parsed: Record<string, { lpoints: number }> = JSON.parse(
        data[0].points_json
      );
      return Object.values(parsed).reduce((x, y) => x + y.lpoints, 0);
    }

    return 0;
  },
} as AdapterExport;
