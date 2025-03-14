import type { AdapterExport } from "../utils/adapter.ts";

import { convertValuesToInt } from "../utils/object.ts";

const API_URL = "https://common.kelpdao.xyz/km-el-points/user/{address}";

export default {
  fetch: async (address: string) => {
    return (
      await (
        await fetch(API_URL.replace("{address}", address.toLowerCase()))
      ).json()
    ).value;
  },
  points: (data: Record<string, string>) => ({
    "Kelp Miles": convertValuesToInt(data),
  }),
  total: (data: Record<string, string>) => ({
    "Kelp Miles": Object.values(convertValuesToInt(data)).reduce(
      (x, y) => x + y,
      0
    ),
  }),
} as AdapterExport;
