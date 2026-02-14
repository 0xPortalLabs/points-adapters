import type { AdapterExport } from "../utils/adapter.ts";
import {
  convertKeysToStartCase,
  convertValuesToNormal,
} from "../utils/object.ts";

import { getAddress } from "viem";

const API_URL =
  'https://restaking-backend.karak.network/getPortfolio?batch=1&input={"0":{"wallet":"{address}"}}';

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
  fetch: async (address: string) => {
    address = getAddress(address);
    const res = await fetch(API_URL.replace("{address}", address), {
      headers: { "User-Agent": "Checkpoint API (https://checkpoint.exchange)" },
    });
    return (await res.json())[0]?.result?.data;
  },
  data: (data: { xpByPhase?: Record<string, number> }) => {
    const xp = data?.xpByPhase ? convertValuesToNormal(data.xpByPhase) : {};
    return { XP: convertKeysToStartCase(xp) };
  },
  total: (data: { xp: number }) => ({ XP: data?.xp }),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
