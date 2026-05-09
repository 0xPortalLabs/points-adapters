import { createPublicClient, fallback, http, parseAbi } from "viem";
import { optimism } from "viem/chains";
import { maybeReadEnv, maybeWrapCORSProxy } from "./cors.ts";

const idRegistryAbi = parseAbi([
  "function idOf(address owner) view returns (uint256 fid)",
]);

const ID_REGISTRY = "0x00000000fc6c5f01fc30151999387bb99a9f489b";
const NEYNAR_API_KEY = maybeReadEnv("NEYNAR_API_KEY", "");
const NEYNAR_BULK_BY_ADDRESS_RAW_URL =
  "https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses={address}";
let neynarBulkByAddressUrl: Promise<string> | null = null;

const getNeynarBulkByAddressUrl = () => {
  neynarBulkByAddressUrl ??= maybeWrapCORSProxy(NEYNAR_BULK_BY_ADDRESS_RAW_URL);
  return neynarBulkByAddressUrl;
};

const options = {
  timeout: 2000,
};
const client = createPublicClient({
  chain: optimism,
  transport: fallback(
    [
      http("https://public-op-mainnet.fastnode.io", options),
      http("https://optimism-rpc.publicnode.com", options),
    ],
    {
      rank: false,
    }
  ),
});

const getFidFromIdRegistry = async (
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

const getFidByAddress = async (address: `0x${string}`): Promise<string> => {
  try {
    const normalized = address.toLowerCase();
    if (!NEYNAR_API_KEY) {
      console.warn(
        "NEYNAR_API_KEY not configured, falling back to onchain Farcaster ID lookup"
      );
      return getFidFromIdRegistry(address);
    }

    const neynarUrl = await getNeynarBulkByAddressUrl();
    const res = await fetch(
      neynarUrl.replace("{address}", normalized),
      {
        headers: {
          accept: "application/json",
          "x-api-key": NEYNAR_API_KEY,
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      const users = data[normalized] ?? data[address] ?? [];
      const custodyMatch = users.find(
        (user: { custody_address?: string }) =>
          user.custody_address?.toLowerCase() === normalized
      );
      const fid = custodyMatch?.fid ?? (users.length === 1 ? users[0]?.fid : null);
      if (typeof fid === "number" && fid > 0) {
        return String(fid);
      }
    }
  } catch {
    // Fall back to the onchain custody-only lookup below.
  }

  return getFidFromIdRegistry(address);
};

const getFidFromCustodyAddress = getFidByAddress;

export { getFidByAddress, getFidFromCustodyAddress };
