import { createPublicClient, http, parseAbi, fallback } from "viem";
import { optimism } from "viem/chains";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const idRegistryAbi = parseAbi([
  "function idOf(address owner) view returns (uint256 fid)",
]);

const ID_REGISTRY = "0x00000000fc6c5f01fc30151999387bb99a9f489b";

const options = {
  timeout: 2000,
};
const client = createPublicClient({
  chain: optimism,
  transport: fallback(
    [
      http("https://public-op-mainnet.fastnode.io", options),
      http("https://optimism-rpc.publicnode.com", options),
      http("https://endpoints.omniatech.io/v1/op/mainnet/public", options),
    ],
    {
      rank: false,
    }
  ),
});

const getFidFromCustodyAddress = async (
  owner: `0x${string}`
): Promise<string> => {
  const fid = await client.readContract({
    address: ID_REGISTRY,
    abi: idRegistryAbi,
    functionName: "idOf",
    args: [owner],
  });

  return String(fid);
};

export { getFidFromCustodyAddress };
