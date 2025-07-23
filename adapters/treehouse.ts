import type { AdapterExport } from "../utils/adapter.ts";

import { startCase } from "lodash-es";

const API_URL =
  "https://api.treehouse.finance/gonuts-s2/weekly-points?address={address}";
const S1_API_URL =
  "https://api.treehouse.finance/gonuts-s1/nuts-accrued?address={address}";

// {"message":"success","total_points_accrued_s1":8764.180039}
/*
  data: [
    {
      wallet_address: "0x69155e7ca2e688ccdc247f6c4ddf374b3ae77bd6",
      total_weekly_points: 0.0010500000604928101,
      week_start_date: "2025-07-14",
      week_end_date: "2025-07-20",
    },
  ],
  message: "success",
  total_points_accrued: 0.007350000423449671,
};
*/
export default {
  fetch: async (address: string) => {
    const [s1, s2] = await Promise.all([
      (await fetch(S1_API_URL.replace("{address}", address))).json(),
      (await fetch(API_URL.replace("{address}", address))).json(),
    ]);

    return { s1, s2 };
  },
  data: ({
    s1,
    s2,
  }: {
    s1: Record<string, unknown>;
    s2: Record<string, unknown>;
  }) => {
    const s2Data: Record<string, string | number> = {};
    if (s2?.data && Array.isArray(s2.data)) {
      s2.data.forEach((obj: Record<string, unknown>, idx: number) => {
        delete obj.wallet_address;

        Object.entries(obj).forEach(([k, v]) => {
          s2Data[`Week ${idx + 1} ${startCase(k)}`] = v as string | number;
        });
      });
    }

    return {
      "S1 Nuts": {
        "Total Points": s1.total_points_accrued_s1 as string | number,
      },
      "S2 Weekly Points": s2Data,
    };
  },
  total: ({
    s1,
    s2,
  }: {
    s1: Record<string, unknown>;
    s2: Record<string, unknown>;
  }) => {
    return {
      "S1 Nuts": s1?.total_points_accrued_s1,
      "S2 Weekly Points": s2?.total_points_accrued,
    };
  },
} as AdapterExport;
