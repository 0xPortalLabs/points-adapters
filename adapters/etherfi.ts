import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://app.ether.fi/api/portfolio/v3/{address}"
);

export default {
  fetch: async (address: string) => {
    return await (await fetch(API_URL.replace("{address}", address))).json();
  },
  points: (data: Record<string, unknown>) => {
    const res: Record<string, number> = {};

    // Parse regular points.
    const parse = (obj: object, prefix = "") => {
      for (const [k, v] of Object.entries(obj)) {
        if (!isNaN(Number(k))) continue; // Array key

        const fullKey = prefix ? `${prefix}.${k}` : k;

        if (typeof v === "number") res[fullKey] = v;
        else if (typeof v === "object" && v !== null) parse(v, fullKey);
      }
    };

    parse(data);

    // Parse badges.
    if (Array.isArray(data.badges)) {
      for (const badge of data.badges) {
        if (typeof badge.Points === "number") {
          res[`badges.${badge.Name}`] = badge.Points;
        }
      }
    }

    return res;
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
    return { current, previous, historical };
  },
} as AdapterExport;
