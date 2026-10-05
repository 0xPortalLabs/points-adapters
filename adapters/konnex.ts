import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { wrapCORSProxy } from "../utils/cors.ts";

const WEBSITE_ID = "7857ae2c-2ebf-4871-a775-349bcdc416ce";
const ORGANIZATION_ID = "dbe51e03-92cc-4a5a-8d57-61c10753246b";
const LOYALTY_CURRENCY_ID = "7b5197b5-6728-4403-9705-7dda22ab8031";
const API_URL = "https://hub.konnex.world/api/loyalty/accounts";

type KonnexData = { points: number };

const getObject = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Konnex response has invalid points data");
  }
  return value as Record<string, unknown>;
};

export default {
  fetch: async (address: string): Promise<KonnexData> => {
    const wallet = getAddress(address).toLowerCase();
    const params = new URLSearchParams({
      websiteId: WEBSITE_ID,
      organizationId: ORGANIZATION_ID,
      loyaltyCurrencyId: LOYALTY_CURRENCY_ID,
      walletAddress: wallet,
      limit: "2",
    });
    const url = `${API_URL}?${params}`;
    // Checkpoint's browser origin is blocked by CORS. Keep backend requests
    // direct and avoid an extra CORS probe on each wallet lookup.
    const requestUrl = "document" in globalThis ? wrapCORSProxy(url) : url;
    let res: Response;
    try {
      res = await fetch(requestUrl, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10000),
      });
    } catch (error) {
      throw new Error(
        "Konnex points request failed before receiving a response",
        {
          cause: error,
        },
      );
    }
    if (!res.ok) {
      throw new Error(`Konnex points request failed with status ${res.status}`);
    }

    const response = getObject(
      await res.json().catch((error: unknown) => {
        throw new Error("Konnex points response is not valid JSON", {
          cause: error,
        });
      }),
    );
    // One KP account is expected per wallet. Never silently truncate or sum
    // unexpected accounts; the endpoint must remain a wallet-scoped lookup.
    if (
      !Array.isArray(response.data) || response.data.length > 1 ||
      response.hasNextPage !== false
    ) {
      throw new Error("Konnex response has invalid account results");
    }
    // Verified unknown wallets return an empty array, not an HTTP error.
    if (response.data.length === 0) return { points: 0 };

    const account = getObject(response.data[0]);
    const user = getObject(account.user);
    if (
      typeof user.walletAddress !== "string" ||
      user.walletAddress.toLowerCase() !== wallet
    ) {
      throw new Error("Konnex response returned a different wallet");
    }
    if (
      account.websiteId !== WEBSITE_ID ||
      account.organizationId !== ORGANIZATION_ID ||
      account.loyaltyCurrencyId !== LOYALTY_CURRENCY_ID
    ) {
      throw new Error("Konnex response returned a different points program");
    }
    if (typeof account.amount !== "string" || !/^\d+$/.test(account.amount)) {
      throw new Error("Konnex response has invalid points");
    }
    const points = Number(account.amount);
    if (!Number.isSafeInteger(points)) {
      throw new Error("Konnex response has invalid points");
    }
    // KP has zero decimals. The credited balance already includes bonuses;
    // do not reapply multipliers or add the leaderboard's grouped balance.
    return { points };
  },
  data: (data: KonnexData) => ({ "Konnex Points": { Total: data.points } }),
  total: (data: KonnexData) => ({ "Konnex Points": data.points }),
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<KonnexData>;
