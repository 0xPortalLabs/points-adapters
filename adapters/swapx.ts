import type { AdapterExport } from "../utils/adapter.ts";

const API_URL =
  "https://soft-moon-4fdf.admin-b72.workers.dev/info/user?address={address}&epoch=0";

/**
 * Response format:
 * {
 *   "message": {
 *     "downlines": {"1":[],"2":[],"3":[]},
 *     "userName": null,
 *     "uplineUserName": null,
 *     "lockedSwpxUSD": 91419.28,
 *     "EpochUserStatsXX": [
 *       {"epoch":4,"powerPercentage":0},
 *       {"epoch":5,"powerPercentage":0.28},
 *       {"epoch":6,"powerPercentage":1.91},
 *       {"epoch":7,"powerPercentage":4.38},
 *       {"epoch":8,"powerPercentage":4.5},
 *       {"epoch":9,"powerPercentage":2.56}
 *     ]
 *   },
 *   "success": true
 * }
 */
export default {
  fetch: async (address: string) => {
    const data = await (
      await fetch(API_URL.replace("{address}", address.toLowerCase()))
    ).json();

    if (!data.success || typeof data.message === "string")
      return { lockedSwpxUSD: 0, EpochUserStatsXX: [] };

    return data.message;
  },
  data: ({
    lockedSwpxUSD,
    EpochUserStatsXX,
  }: {
    lockedSwpxUSD: number;
    EpochUserStatsXX: Array<{ epoch: number; powerPercentage: number }>;
  }) => {
    const epochData = Object.fromEntries(
      EpochUserStatsXX.map(({ epoch, powerPercentage }) => [
        `Epoch ${epoch}`,
        powerPercentage,
      ])
    );

    return { lockedSwpxUSD, ...epochData };
  },
  total: ({ lockedSwpxUSD }: { lockedSwpxUSD: number }) => lockedSwpxUSD,
} as AdapterExport;
