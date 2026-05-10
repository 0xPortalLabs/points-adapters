import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";
import { isEmpty } from "lodash-es";
import { convertKeysToStartCase } from "../utils/object.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://mainnet.prod.lombard.finance/api/v1/referral-system/season-3/points/{address}"
);

type API_RESPONSE = {
  protocol_points_map: Record<string, number>;
};

export default {
  fetch: async (address: string) => {
    const response = await fetch(API_URL.replace("{address}", address), {
      headers: {
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
    });
    const data = await response.json();

    // API returns an empty object when address doesn't exist
    if (!data || isEmpty(data)) {
      return {
        protocol_points_map: {},
      };
    }
    return data;
  },
  data: (data: API_RESPONSE) => ({
    Lux: { ...convertKeysToStartCase(data.protocol_points_map) },
  }),
  total: (data: API_RESPONSE) => ({
    Lux: Object.values(data.protocol_points_map).reduce(
      (sum, points) => sum + points,
      0
    ),
  }),
  claimable: () => true,
  supportedAddressTypes: ["evm"],
} as AdapterExport;
