import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";
import { getAddress } from "viem";

import { startCase } from "lodash-es";

const API_URL = await maybeWrapCORSProxy(
  "https://www.ether.fi/api/dapp/portfolio/v3/{address}",
);

export default {
  fetch: async (address: string) => {
    const normalizedAddress = getAddress(address).toLowerCase();
    const res = await fetch(API_URL.replace("{address}", normalizedAddress));
    if (!res.ok)
      throw new Error(`Failed to fetch etherfi data ${await res.text()}`);
    return res.json();
  },
  data: ({
    TotalPointsSummary,
  }: {
    TotalPointsSummary: Record<string, Record<string, number>>;
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
        TotalPointsSummary as Record<string, unknown>,
      )) {
        for (const [type, value] of Object.entries(
          points as Record<string, number>,
        )) {
          parse(category, type, value);
        }
      }
    }

    return groups;
  },
  total: ({
    TotalPointsSummary,
  }: {
    TotalPointsSummary: Record<string, Record<string, number>>;
  }) => {
    let totalCurrentPoints = 0;

    if (TotalPointsSummary && typeof TotalPointsSummary === "object") {
      for (const points of Object.values(TotalPointsSummary)) {
        if (points && typeof points === "object" && points.CurrentPoints) {
          totalCurrentPoints += points.CurrentPoints;
        }
      }
    }

    return totalCurrentPoints;
  },
} as AdapterExport;
