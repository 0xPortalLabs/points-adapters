import { formatUnits, getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const SEASON_0_API_URL = await maybeWrapCORSProxy(
  "https://makina.finance/api/points/{address}",
);
const MERKL_API_URL = await maybeWrapCORSProxy("https://api.merkl.xyz/v4");

const INK_CHAIN_ID = 57073;
const MAKINA_POINTS_ADDRESS = "0x3419966bC74fa8f951108d15b053bEd233974d3D";
const POINTS_NAME = "Makina Points";

type Season0Response = {
  season0Points?: number;
};

type MerklReward = {
  amount: string;
  claimed: string;
  pending: string;
  token: {
    address: string;
    decimals: number;
  };
};

type MerklUserRewards = Array<{
  rewards: MerklReward[];
}>;

type MakinaData = {
  season0Points: number;
  rewards: MerklReward[];
};

const toPoints = (value: string, decimals: number) =>
  parseFloat(formatUnits(BigInt(value), decimals));

const getDetails = (data: MakinaData) =>
  data.rewards.reduce(
    (totals, reward) => {
      const amount = toPoints(reward.amount, reward.token.decimals);
      const claimed = toPoints(reward.claimed, reward.token.decimals);
      const pending = toPoints(reward.pending, reward.token.decimals);

      totals.Total += amount + pending;
      totals["Merkl Amount"] += amount;
      totals["Merkl Claimed"] += claimed;
      totals["Merkl Pending"] += pending;
      return totals;
    },
    {
      Total: data.season0Points,
      "Season 0": data.season0Points,
      "Merkl Amount": 0,
      "Merkl Claimed": 0,
      "Merkl Pending": 0,
    },
  );

export default {
  fetch: async (address: string): Promise<MakinaData> => {
    const normalizedAddress = getAddress(address).toLowerCase();
    const url = new URL(`${MERKL_API_URL}/users/${normalizedAddress}/rewards`);
    url.searchParams.set("chainId", String(INK_CHAIN_ID));

    const [season0Res, merklRes] = await Promise.all([
      fetch(SEASON_0_API_URL.replace("{address}", normalizedAddress), {
        headers: {
          Accept: "application/json",
          "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
        },
      }),
      fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
        },
      }),
    ]);

    if (!season0Res.ok) {
      throw new Error(
        `Makina season 0 points request failed with status ${season0Res.status}`,
      );
    }

    if (!merklRes.ok) {
      throw new Error(
        `Makina Merkl points request failed with status ${merklRes.status}`,
      );
    }

    const season0 = await season0Res.json() as Season0Response;
    const merkl = await merklRes.json() as MerklUserRewards;

    return {
      season0Points: Number(season0.season0Points ?? 0) || 0,
      rewards: merkl
        .flatMap((chain) => chain.rewards)
        .filter(
          (reward) =>
            reward.token.address.toLowerCase() ===
              MAKINA_POINTS_ADDRESS.toLowerCase(),
        ),
    };
  },
  data: (data: MakinaData) => ({ [POINTS_NAME]: getDetails(data) }),
  total: (data: MakinaData) => {
    const details = getDetails(data);
    return {
      [POINTS_NAME]: details.Total,
    };
  },
  supportedAddressTypes: ["evm"],
} as AdapterExport<MakinaData>;
