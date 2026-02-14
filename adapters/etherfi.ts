import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";
import { getAddress } from "viem";

const API_URL = await maybeWrapCORSProxy(
  "https://www.ether.fi/api/dapp/portfolio/v3/{address}"
);

export default {
  fetch: async (address: string) => {
    const normalizedAddress = getAddress(address).toLowerCase();
    const res = await fetch(API_URL.replace("{address}", normalizedAddress), {
      headers: { "User-Agent": "Checkpoint API (https://checkpoint.exchange)" },
    });
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
      switch (type) {
        case "AllTimePoints":
          groups["All Time Points"][category] = value;
          break;
        case "CurrentPoints":
          groups["Current Points"][category] = value;
          break;
        case "LastMonthPoints":
          groups["Last Month Points"][category] = value;
          break;
        case "Latest3MonthsPoints":
          groups["Latest 3 Months Points"][category] = value;
          break;
      }
    };

    if (TotalPointsSummary && typeof TotalPointsSummary === "object") {
      const summary = TotalPointsSummary as Record<
        string,
        Record<string, number>
      >;
      for (const category in summary) {
        const points = summary[category];
        if (!points || typeof points !== "object") continue;
        for (const type in points) {
          parse(category, type, points[type]);
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
      const summary = TotalPointsSummary as Record<
        string,
        Record<string, number>
      >;
      for (const category in summary) {
        const points = summary[category];
        if (!points || typeof points !== "object") continue;
        if (points.CurrentPoints) totalCurrentPoints += points.CurrentPoints;
      }
    }

    return totalCurrentPoints;
  },
  supportedAddressTypes: ["evm"],
} as AdapterExport;
