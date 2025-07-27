import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

import { startCase } from "lodash-es";

const API_URL = await maybeWrapCORSProxy(
  "https://www.ether.fi/api/dapp/portfolio/v3/{address}"
);

export default {
  fetch: async (address: string) => {
    address = address.toLowerCase();
    return await (await fetch(API_URL.replace("{address}", address))).json();
  },
  data: ({
    TotalPointsSummary,
  }: {
    TotalPointsSummary: Record<string, number>;
  }) => {
    const groups: Record<string, Record<string, number>> = {
      "All Time Points": {},
      "Current Points": {},
      "Last Month Points": {},
      "Latest 3 Months Points": {},
    };

    const parse = (category: string, type: string, value: number) => {
      if (type === "AllTimePoints") {
        groups["All Time Points"][category] = value;
      } else if (type === "CurrentPoints") {
        groups["Current Points"][category] = value;
      } else if (type === "LastMonthPoints") {
        groups["Last Month Points"][category] = value;
      } else if (type === "Latest3MonthsPoints") {
        groups["Latest 3 Months Points"][category] = value;
      }
    };

    if (TotalPointsSummary && typeof TotalPointsSummary === "object") {
      for (const [category, points] of Object.entries(
        TotalPointsSummary as Record<string, unknown>
      )) {
        for (const [type, value] of Object.entries(
          points as Record<string, number>
        )) {
          parse(category, type, value);
        }
      }
    }

    return groups;
  },
  total: ({ TotalEffectiveBalance }: { TotalEffectiveBalance: number }) =>
    TotalEffectiveBalance,
} as AdapterExport;
