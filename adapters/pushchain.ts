import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";

const API_URL = "https://us-east1-push-prod-apps.cloudfunctions.net/" +
  "pushpointsrewardsystem/v3/users/wallet/{identity}";

const EVM_IDENTITIES = [
  ["Ethereum Sepolia", "eip155:11155111"],
  ["Ethereum", "eip155:1"],
  ["Push Testnet", "eip155:42101"],
  ["Base Sepolia", "eip155:84532"],
  ["BNB Testnet", "eip155:97"],
] as const;
const SOLANA_DEVNET = [
  "Solana Devnet",
  "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
] as const;

type PushAccount = {
  userWallet?: unknown;
  lifetimePointsEarned?: unknown;
};

type PushResult = {
  label: string;
  account: PushAccount;
};

const getPoints = (account: PushAccount): number => {
  const points = account.lifetimePointsEarned;
  if (typeof points !== "number" || !Number.isFinite(points) || points < 0) {
    throw new Error("Push Chain response has invalid lifetime points");
  }

  return points;
};

const getTotal = (results: PushResult[]): number =>
  results.reduce((total, { account }) => total + getPoints(account), 0);

const fetchAccount = async (
  label: string,
  identity: string,
): Promise<PushResult | undefined> => {
  const res = await fetch(
    API_URL.replace("{identity}", encodeURIComponent(identity)),
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
    },
  );

  if (res.status === 404) return undefined;
  if (!res.ok) {
    throw new Error(`Push Chain request failed with status ${res.status}`);
  }

  const data = await res.json();
  if (!data || typeof data !== "object") {
    throw new Error("Push Chain response has invalid data");
  }

  const account = data as PushAccount;
  if (account.userWallet !== identity) {
    throw new Error("Push Chain response returned a different wallet");
  }

  return { label, account };
};

export default {
  fetch: async (address: string) => {
    const isEVM = address.startsWith("0x");
    const normalizedAddress = isEVM ? getAddress(address) : address;

    // Push keys Season 3 rewards by full CAIP-10 identity. The same raw EVM
    // address can have separate accounts on different origin chains, while
    // Checkpoint receives only the raw address. Query every observed Season 3
    // namespace and sum its cumulative points. Do not expose a rank because
    // balances and ranks can differ by identity.
    const identities = isEVM ? EVM_IDENTITIES : [SOLANA_DEVNET];
    const results = await Promise.all(
      identities.map(([label, prefix]) =>
        fetchAccount(label, `${prefix}:${normalizedAddress}`)
      ),
    );

    return results.filter((result): result is PushResult => Boolean(result));
  },
  data: (results: PushResult[]) => ({
    "Push Points": {
      Total: getTotal(results),
      ...Object.fromEntries(
        results.map(({ label, account }) => [label, getPoints(account)]),
      ),
    },
  }),
  total: (results: PushResult[]) => ({
    "Push Points": getTotal(results),
  }),
  supportedAddressTypes: ["evm", "svm"],
} satisfies AdapterExport<PushResult[]>;
