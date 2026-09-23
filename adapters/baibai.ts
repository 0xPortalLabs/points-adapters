import { getAddress } from "viem";
import type {
  AdapterExport,
  LabelledDetailedData,
  LabelledPoints,
} from "../utils/adapter.ts";
import { wrapCORSProxy } from "../utils/cors.ts";

const API_URL = "https://app.baibai.cx/trpc/points.summary";

type BaiBaiData = {
  points?: number;
};

const getObject = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("BaiBai response has invalid points data");
  }
  return value as Record<string, unknown>;
};

export default {
  fetch: async (address: string): Promise<BaiBaiData> => {
    const owner = getAddress(address).toLowerCase();
    const input = encodeURIComponent(JSON.stringify({ owner }));
    const url = `${API_URL}?input=${input}`;
    // Verified CORS denial from Checkpoint. Server runtimes stay direct;
    // browsers use the configured proxy without an extra CORS probe request.
    const requestUrl = "document" in globalThis ? wrapCORSProxy(url) : url;
    let res: Response;
    try {
      res = await fetch(requestUrl, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10000),
      });
    } catch (error) {
      throw new Error(
        "BaiBai points request failed before receiving a response",
        { cause: error },
      );
    }
    if (!res.ok) {
      throw new Error(`BaiBai points request failed with status ${res.status}`);
    }

    const response = getObject(await res.json());
    if (response.error) {
      throw new Error("BaiBai points query returned an error");
    }
    const data = getObject(getObject(response.result).data);
    if (typeof data.owner !== "string" || data.owner.toLowerCase() !== owner) {
      throw new Error("BaiBai response returned a different wallet");
    }

    // The API schema makes totalPoints optional; the app displays "Pending"
    // until a snapshot exists, including for unused wallets. Do not invent zero.
    if (data.totalPoints === undefined) {
      if (typeof data.volumeUsd !== "string" || !Array.isArray(data.quests)) {
        throw new Error("BaiBai response has invalid pending points data");
      }
      return {};
    }
    if (
      typeof data.totalPoints !== "string" ||
      !/^\d+(\.\d+)?$/.test(data.totalPoints)
    ) {
      throw new Error("BaiBai response has invalid total points");
    }
    const points = Number(data.totalPoints);
    if (!Number.isFinite(points)) {
      throw new Error("BaiBai response has invalid total points");
    }

    // Published weekly total already includes boosts, quests, and referrals.
    // The current configuration ends on 2026-10-01 UTC; recheck season semantics
    // on rollover rather than combining snapshots or hardcoding a season label.
    return { points };
  },
  data: (data: BaiBaiData): LabelledDetailedData => ({
    "BaiBai Points": data.points === undefined
      ? { Status: "Pending" }
      : { Total: data.points },
  }),
  total: (data: BaiBaiData): LabelledPoints =>
    data.points === undefined ? {} : { "BaiBai Points": data.points },
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<BaiBaiData>;
