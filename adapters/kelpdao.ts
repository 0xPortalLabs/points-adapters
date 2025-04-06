import type { AdapterExport } from "../utils/adapter.ts";

import {
  convertKeysToStartCase,
  convertValuesToNormal,
} from "../utils/object.ts";

const API_URL = "https://common.kelpdao.xyz/km-el-points/user/{address}";

export default {
  fetch: async (address: string) => {
    return (
      await (
        await fetch(API_URL.replace("{address}", address.toLowerCase()))
      ).json()
    ).value;
  },
  data: (data: Record<string, string>) => ({
    "Kelp Miles": convertKeysToStartCase(convertValuesToNormal(data)),
  }),
  total: (data: Record<string, string>) => ({
    "Kelp Miles": Object.values(convertValuesToNormal(data)).reduce(
      (x, y) => Number(x) + Number(y),
      0
    ),
  }),
} as AdapterExport;
