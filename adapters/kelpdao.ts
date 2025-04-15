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
    "Kernel Points": convertKeysToStartCase(convertValuesToNormal(data)),
  }),
  total: ({ kelpMiles }: { kelpMiles: string }) => ({
    "Kernel Points": parseFloat(kelpMiles) / 1000,
  }),
  claimable: ({ kelpMiles }: { kelpMiles: string }) =>
    parseFloat(kelpMiles) > 0,
} as AdapterExport;
