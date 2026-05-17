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

type API_RESPONSE = { rewards: Reward[] }[];

const getRewards = (data: API_RESPONSE) =>
  data
    .flatMap((chain) => chain.rewards)
    .filter((x) => x.token.address.toLowerCase() === GRAVITY_POINTS_ADDRESS);

const toAmount = (value: string, decimals: number) =>
  Number(value) / 10 ** decimals;

export default {
  fetch: async (address: string) => {
    address = address.toLowerCase();
    const res = await fetch(API_URL.replace("{address}", address), {
      headers: {
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
    });

    return await res.json();
  },
  data: (data: API_RESPONSE) => {
    return Object.fromEntries(
      getRewards(data).map((x) => {
        return [
          POINTS_NAME,
          {
            Amount: toAmount(x.amount, x.token.decimals),
            Claimed: toAmount(x.claimed, x.token.decimals),
            Pending: toAmount(x.pending, x.token.decimals),
          },
        ];
      })
    );
  },
  total: (data: API_RESPONSE) => {
    return getRewards(data).reduce(
      (totals, x) => {
        totals[POINTS_NAME] =
          (totals[POINTS_NAME] ?? 0) +
          toAmount(x.amount, x.token.decimals) +
          toAmount(x.pending, x.token.decimals);
        return totals;
      },
      { "Gravity Points": 0 }
    );
  },
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<API_RESPONSE>;
