import { formatUnits, getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const MERKL_API_URL = await maybeWrapCORSProxy("https://api.merkl.xyz/v4");

const MONAD_CHAIN_ID = 143;
const SHMON_POINTS_ADDRESS = "0xCdEF0ED16c5800025B26908b3Be9e6Ad4Ef187a5";
const SHMON_POINTS_DECIMALS = 18;
const POINTS_NAME = "shMON Points";

type Reward = {
  amount: string;
  claimed: string;
  pending: string;
  recipient: string;
};

type API_RESPONSE = Reward[];

const toAmount = (value: string) =>
  parseFloat(formatUnits(BigInt(value), SHMON_POINTS_DECIMALS));

const getDetails = (data: API_RESPONSE) =>
  data.reduce(
    (totals, reward) => {
      totals.Amount += toAmount(reward.amount);
      totals.Claimed += toAmount(reward.claimed);
      totals.Pending += toAmount(reward.pending);
      return totals;
    },
    { Amount: 0, Claimed: 0, Pending: 0 },
  );

export default {
  fetch: async (address: string) => {
    const normalizedAddress = getAddress(address);
    const url = new URL(`${MERKL_API_URL}/rewards/token/`);
    url.searchParams.set("chainId", String(MONAD_CHAIN_ID));
    url.searchParams.set("address", SHMON_POINTS_ADDRESS);
    url.searchParams.set("recipient", normalizedAddress);
    url.searchParams.set("page", "0");
    url.searchParams.set("items", "20");

    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
    });

    if (!res.ok) {
      throw new Error(`shMON points request failed with status ${res.status}`);
    }

    return await res.json() as API_RESPONSE;
  },
  data: (data: API_RESPONSE) => ({ [POINTS_NAME]: getDetails(data) }),
  total: (data: API_RESPONSE) => {
    const details = getDetails(data);
    return {
      [POINTS_NAME]: details.Amount,
    };
  },
  supportedAddressTypes: ["evm"],
} as AdapterExport<API_RESPONSE>;
