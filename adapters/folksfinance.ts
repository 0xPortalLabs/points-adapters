import {
  encodeErrorResult,
  encodeFunctionData,
  getAddress,
  pad,
  parseAbi,
} from "viem";
import type { AdapterExport } from "../utils/adapter.ts";

const RPC_URL = "https://api.avax.network/ext/bc/C/rpc";
const POINTS_URL = "https://api.points.xapp.folks.finance/xchain/account/";
const ACCOUNT_MANAGER = "0x12Db9758c4D9902334C523b94e436258EB54156f";
// Folks chain IDs (not EVM chain IDs): Avalanche, Ethereum, Base, BSC,
// Arbitrum, Polygon, Sei, Monad. All registrations live on the Avalanche hub.
const CHAIN_IDS = [100, 101, 102, 103, 104, 106, 107, 108];
const ABI = parseAbi([
  "function getAccountIdOfAddressOnChain(bytes32 addr, uint16 chainId) view returns (bytes32)",
  "error NoAccountRegisteredTo(uint16 chainId, bytes32 addr)",
]);

type FolksData = {
  accounts: string[];
  points: number;
};

const asObject = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Folks Finance returned invalid response data");
  }
  return value as Record<string, unknown>;
};

const request = async (url: string, init?: RequestInit): Promise<unknown> => {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    throw new Error(
      "Folks Finance request failed before receiving a response",
      {
        cause: error,
      },
    );
  }
  if (!response.ok) {
    throw new Error(
      `Folks Finance request failed with status ${response.status}`,
    );
  }
  return response.json();
};

const getAccounts = async (address: string): Promise<string[]> => {
  const genericAddress = pad(
    getAddress(address).toLowerCase() as `0x${string}`,
  );
  const response = await request(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(CHAIN_IDS.map((chainId) => ({
      jsonrpc: "2.0",
      id: chainId,
      method: "eth_call",
      params: [{
        to: ACCOUNT_MANAGER,
        data: encodeFunctionData({
          abi: ABI,
          functionName: "getAccountIdOfAddressOnChain",
          args: [genericAddress, chainId],
        }),
      }, "latest"],
    }))),
  });
  if (!Array.isArray(response) || response.length !== CHAIN_IDS.length) {
    throw new Error("Folks Finance returned an incomplete account lookup");
  }

  const pending = new Set(CHAIN_IDS);
  const accounts = new Set<string>();
  for (const item of response) {
    const row = asObject(item);
    if (
      row.jsonrpc !== "2.0" || typeof row.id !== "number" ||
      !pending.delete(row.id)
    ) {
      throw new Error("Folks Finance returned an invalid RPC response ID");
    }
    if (row.error !== undefined) {
      const error = asObject(row.error);
      const missingAccount = encodeErrorResult({
        abi: ABI,
        errorName: "NoAccountRegisteredTo",
        args: [row.id, genericAddress],
      });
      // Only this exact contract revert means no account; do not hide RPC failures.
      if (
        row.result === undefined && error.code === 3 &&
        error.data === missingAccount
      ) continue;
      throw new Error(
        `Folks Finance account lookup failed for chain ${row.id}`,
      );
    }
    if (
      typeof row.result !== "string" ||
      !/^0x[0-9a-fA-F]{64}$/.test(row.result) ||
      /^0x0{64}$/.test(row.result)
    ) {
      throw new Error("Folks Finance returned an invalid account ID");
    }
    accounts.add(row.result.toLowerCase());
  }
  // The same account may be registered on multiple chains. Count it only once.
  return [...accounts].sort();
};

export default {
  fetch: async (address: string): Promise<FolksData> => {
    const accounts = await getAccounts(address);
    const totals = await Promise.all(accounts.map(async (account) => {
      const data = asObject(
        await request(POINTS_URL + account, {
          headers: { Accept: "application/json" },
        }),
      );
      if (
        typeof data.total !== "number" || !Number.isFinite(data.total) ||
        data.total < 0
      ) {
        throw new Error("Folks Finance returned invalid total points");
      }
      return data.total;
    }));
    const points = totals.reduce((sum, total) => sum + total, 0);
    if (!Number.isFinite(points)) {
      throw new Error("Folks Finance points total overflowed");
    }
    return { accounts, points };
  },
  data: (data: FolksData) => ({
    "Folks Points": {
      Total: data.points,
      ...(data.accounts.length
        ? { "Account IDs": `Accounts: ${data.accounts.join(", ")}` }
        : {}),
    },
  }),
  total: (data: FolksData) => ({ "Folks Points": data.points }),
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<FolksData>;
