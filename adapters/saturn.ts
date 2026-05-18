import type { AdapterExport } from "../utils/adapter.ts";

const API_URL = "https://api.merkl.xyz/v4/users/{address}/rewards?chainId=1";
const GRAVITY_POINTS_ADDRESS = "0xd223bbdd0421e394c0df9dffe568f1dadffd6f85";
const POINTS_NAME = "Gravity Points";

type Reward = {
  amount: string;
  claimed: string;
  pending: string;
  token: {
    address: string;
    decimals: number;
  };
};

type API_RESPONSE = Reward[];

const toAmount = (value: string, decimals: number) =>
  Number(value) / 10 ** decimals;

const getDetails = (data: API_RESPONSE) =>
  data.reduce(
    (totals, x) => {
      totals.Amount += toAmount(x.amount, x.token.decimals);
      totals.Claimed += toAmount(x.claimed, x.token.decimals);
      totals.Pending += toAmount(x.pending, x.token.decimals);
      return totals;
    },
    { Amount: 0, Claimed: 0, Pending: 0 }
  );

export default {
  fetch: async (address: string) => {
    address = address.toLowerCase();
    const res = await fetch(API_URL.replace("{address}", address), {
      headers: {
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
    });

    // Filter for only Gravity Points.
    return ((await res.json()) as { rewards: Reward[] }[])
      .flatMap((chain) => chain.rewards)
      .filter((x) => x.token.address.toLowerCase() === GRAVITY_POINTS_ADDRESS);
  },
  data: (data: API_RESPONSE) => ({ [POINTS_NAME]: getDetails(data) }),
  total: (data: API_RESPONSE) => {
    const details = getDetails(data);
    return {
      [POINTS_NAME]: details.Amount + details.Pending,
    };
  },
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<API_RESPONSE>;
