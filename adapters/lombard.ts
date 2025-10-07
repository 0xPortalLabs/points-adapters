import type { AdapterExport } from "../utils/adapter.ts";

import { startCase } from "lodash-es";

const API_URL =
  "https://bff.prod.lombard.finance/sentio-api/lombard-points/{address}";

/*
 * [{
 *   account:	"0x3c2..."
 *   points_json:	'{"lombard-etherfi-ethereum":{"bpoints":0,"lpoints":15.199198466659,"ebtc_balance":0,"multiplier":2}}'
 * }]
 */
export default {
  fetch: async (address: string) => {
    return (await (await fetch(API_URL.replace("{address}", address))).json())
      .result.rows;
  },
  data: (data: { points_json: string }[]) => {
    const parsed = JSON.parse(data[0].points_json);
    return Object.fromEntries(
      Object.entries(parsed).flatMap(([cat, x]) =>
        Object.entries(x as Record<string, number>).map(([k, v]) => {
          return [`${startCase(cat)}: ${startCase(k)}`, v];
        })
      )
    );
  },
  total: (data: { points_json: string }[]) => {
    const parsed: Record<string, { lpoints: number }> = JSON.parse(
      data[0].points_json
    );
    return Object.values(parsed).reduce((x, y) => x + y.lpoints, 0);
  },
} as AdapterExport;
