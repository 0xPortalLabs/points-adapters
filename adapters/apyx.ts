import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://api.apyx.fi/v1/point?address={address}"
);

type Conversion = {
  conversionName: string;
  total: string;
};

type API_RESPONSE = {
  data?: {
    address?: string;
    points?: {
      total?: string;
      referralTotal?: string;
      byConversion?: Conversion[];
    };
  };
};

const toNumber = (value: string | number | undefined): number =>
  Number(value ?? 0) || 0;

const getPoints = (data: API_RESPONSE) => data.data?.points ?? {};

export default {
  fetch: async (address: string) => {
    const normalizedAddress = getAddress(address).toLowerCase();
    const res = await fetch(API_URL.replace("{address}", normalizedAddress), {
      headers: {
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
    });

    if (!res.ok) {
      throw new Error(`APYX point request failed with status ${res.status}`);
    }

    return await res.json();
  },
  data: (data: API_RESPONSE) => {
    const points = getPoints(data);
    const conversions = Object.fromEntries(
      (points.byConversion ?? []).map((conversion) => [
        conversion.conversionName,
        toNumber(conversion.total),
      ])
    );

    return {
      Pips: {
        Total: toNumber(points.total),
        "Referral Pips": toNumber(points.referralTotal),
        ...conversions,
      },
    };
  },
  total: (data: API_RESPONSE) => ({
    Pips: toNumber(getPoints(data).total),
  }),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
