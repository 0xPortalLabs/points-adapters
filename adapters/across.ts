import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";
import { getAddress, formatEther } from "viem";
import { convertValuesToNormal } from "../utils/object.ts";
const API_URL = await maybeWrapCORSProxy(
  "https://public.api.across.to/rewards/op-rebates/summary?userAddress={address}",
);

//   0x181142De6a3666Ddd27bdaC934011D6d8Dc8CE71

// {
//   depositsCount: 8,
//   unclaimedRewards: "43300169803918422",
//   volumeUsd: 122.48187456179605,
//   claimableRewards: "0"
// }

type Response = {
  depositsCount: number;
  unclaimedRewards: string;
  volumeUsd: number;
  claimableRewards: string;
};
export default {
  fetch: async (address) => {
    const res = await fetch(API_URL.replace("{address}", getAddress(address)));
    return await res.json();
  },
  data: (data: Response) => {
    return convertValuesToNormal({
      ...data,
      unclaimedRewards: Number(formatEther(BigInt(data.unclaimedRewards))),
    });
  },
  total: (data: Response) => ({
    OP: Number(formatEther(BigInt(data.unclaimedRewards))),
  }),
  claimable: (data: Response) => Number(data.claimableRewards) > 0,
} as AdapterExport;
