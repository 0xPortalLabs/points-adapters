import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

import { startCase } from "lodash-es";

const API_URL = await maybeWrapCORSProxy(
  "https://app.ether.fi/api/portfolio/v3/{address}"
);

export default {
  fetch: async (address: string) => {
    address = address.toLowerCase();
    return await (await fetch(API_URL.replace("{address}", address))).json();
  },
  data: (data: Record<string, unknown>) => {
    const grouped: Record<string, Record<string, number>> = {
      "Current Season Points": {},
      "Previous Season Points": {},
      "Previous Historical Points": {},
    };

    // Helper to group keys
    const assignToGroup = (key: string, value: number) => {
      if (key.toLowerCase().includes("current season")) {
        grouped["Current Season Points"][key] = value;
      } else if (key.toLowerCase().includes("previous season")) {
        grouped["Previous Season Points"][key] = value;
      } else if (key.toLowerCase().includes("previous historical")) {
        grouped["Previous Historical Points"][key] = value;
      }
    };

    // Parse regular points.
    const parse = (obj: object, prefix = "") => {
      for (let [k, v] of Object.entries(obj)) {
        if (!isNaN(Number(k))) continue; // Array key
        k = startCase(k);
        const fullKey = prefix ? `${startCase(prefix)}: ${k}` : k;
        if (typeof v === "number") assignToGroup(fullKey, v);
        else if (typeof v === "object" && v !== null) parse(v, fullKey);
      }
    };

    parse(data);

    // Parse badges.
    if (Array.isArray(data.badges)) {
      for (const badge of data.badges) {
        if (typeof badge.Points === "number") {
          assignToGroup(`Badges: ${badge.Name}`, badge.Points);
        }
      }
    }

    return grouped;
  },
  total: (data: Record<string, unknown>) => {
    let historical = 0;
    let previous = 0;
    let current = 0;

    const traverse = (obj: object) => {
      for (const value of Object.values(obj)) {
        if (typeof value === "object" && value !== null) {
          traverse(value);
        }
      }

      // I love typescript
      const x = obj as { [key: string]: unknown };

      if (typeof x.CurrentSeasonPoints === "number")
        current += x.CurrentSeasonPoints;

      if (typeof x.PreviousSeasonPoints === "number")
        previous += x.PreviousSeasonPoints;

      if (typeof x.PreviousHistoricalPoints === "number")
        historical += x.PreviousHistoricalPoints;
    };

    traverse(data);
    return {
      "Current Season Points": current,
      "Previous Season Points": previous,
      "Previous Historical Points": historical,
    };
  },
} as AdapterExport;
