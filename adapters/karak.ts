import type { AdapterExport } from "../utils/adapter.ts";
import {
  convertKeysToStartCase,
  convertValuesToNormal,
} from "../utils/object.ts";

type API_RESPONSE = {
  xp?: number;
  xpByPhase?: Record<string, number>;
};

const emptyResponse = (): API_RESPONSE => ({
  xp: 0,
  xpByPhase: {},
});

/**
 *  data: {
        xp: 766112.2666695756,
        xpByPhase: { phase1: 0, phase2: 766112.2666695756, phase3: 0 },
        usersReferred: 0,
        assetInfo: {
          BTC: { restakedRaw: "0", referredRaw: "0" },
          ETH: { restakedRaw: "0", referredRaw: "0" },
          USD: { restakedRaw: "0", referredRaw: "0" },
          BNB: { restakedRaw: "0", referredRaw: "0" },
          BLAST: { restakedRaw: "0", referredRaw: "0" },
          ARB: { restakedRaw: "0", referredRaw: "0" },
          ETHFI: { restakedRaw: "0", referredRaw: "0" },
          MKR: { restakedRaw: "0", referredRaw: "0" },
          FXS: { restakedRaw: "0", referredRaw: "0" },
        },
      },
 */
export default {
  fetch: async () => await Promise.resolve(emptyResponse()),
  data: (data: API_RESPONSE) => {
    const xp = data?.xpByPhase ? convertValuesToNormal(data.xpByPhase) : {};
    return { XP: convertKeysToStartCase(xp) };
  },
  total: (data: API_RESPONSE) => ({ XP: data?.xp ?? 0 }),
  deprecated: () => ({
    XP: 1783468800, // July 8th 2026 00:00 UTC
  }),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
