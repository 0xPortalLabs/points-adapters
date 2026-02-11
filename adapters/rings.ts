import type { AdapterExport } from "../utils/adapter.ts";
import {
  convertKeysToStartCase,
  convertValuesToNormal,
} from "../utils/object.ts";

import { getAddress } from "viem";

// Points program has now fully ended and API is no longer available.
export default {
  fetch: async () => await Promise.resolve({}),
  data: () => ({}),
  total: () => 0,
  claimable: () => false,
  deprecated: () => ({ Points: 1761955200 }), // Nov 1st 00:00 UTC
} as AdapterExport;
