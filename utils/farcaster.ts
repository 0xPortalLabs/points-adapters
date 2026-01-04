import { createPublicClient, http, parseAbi } from "viem";
import { optimism } from "viem/chains";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const idRegistryAbi = parseAbi([
  "function idOf(address owner) view returns (uint256 fid)"
]);

const ID_REGISTRY = "0x00000000fc6c5f01fc30151999387bb99a9f489b";

const client = createPublicClient({
  chain: optimism,
  transport: http(
    await maybeWrapCORSProxy("https://public-op-mainnet.fastnode.io")
  )
});

export async function fidFromCustodyAddress(owner: `0x${string}`) {
  const fid = await client.readContract({
    address: ID_REGISTRY,
    abi: idRegistryAbi,
    functionName: "idOf",
    args: [owner]
  });

  return fid;
}
