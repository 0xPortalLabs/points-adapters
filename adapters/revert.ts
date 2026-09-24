import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { wrapCORSProxy } from "../utils/cors.ts";

const API_URL = "https://api.revert.finance/v1/xp-total/";

type RevertData = {
  activity: number;
  lending: number;
  referrals: number;
  total: number;
};

const getObject = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Revert response has invalid points data");
  }
  return value as Record<string, unknown>;
};

const getPoints = (value: unknown): number => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error("Revert response has invalid points");
  }
  return value;
};

export default {
  fetch: async (address: string): Promise<RevertData> => {
    const normalizedAddress = getAddress(address).toLowerCase();
    const url = API_URL + normalizedAddress;
    // Revert only allows its own browser origin. Servers stay direct;
    // browsers use the configured proxy without an extra CORS probe.
    const requestUrl = "document" in globalThis ? wrapCORSProxy(url) : url;
    let res: Response;
    try {
      res = await fetch(requestUrl, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10000),
      });
    } catch (error) {
      throw new Error(
        "Revert points request failed before receiving a response",
        {
          cause: error,
        },
      );
    }
    if (!res.ok) {
      throw new Error(`Revert points request failed with status ${res.status}`);
    }

    const response = getObject(
      await res.json().catch((error: unknown) => {
        throw new Error("Revert points response is not valid JSON", {
          cause: error,
        });
      }),
    );
    if (response.success !== true) {
      throw new Error("Revert points query returned an error");
    }
    const data = getObject(response.data);
    // The API omits account_id for lending-only and unknown wallets.
    if (
      data.account_id !== undefined &&
      (typeof data.account_id !== "string" ||
        data.account_id.toLowerCase() !== normalizedAddress)
    ) {
      throw new Error("Revert response returned a different wallet");
    }
    const activity = getPoints(data.total_points);
    const lending = getPoints(data.lender_points);
    const referrals = getPoints(data.ref_points);
    // Match Revert's frontend: total_points excludes lending and referral points.
    // These are cumulative balances, not the leaderboard's last-30-day points.
    // Unknown wallets return all three fields as zero; errors are not zero balances.
    const total = getPoints(activity + lending + referrals);
    return { activity, lending, referrals, total };
  },
  data: (data: RevertData) => ({
    "Revert Points": {
      Total: data.total,
      Activity: data.activity,
      Lending: data.lending,
      Referrals: data.referrals,
    },
  }),
  total: (data: RevertData) => ({ "Revert Points": data.total }),
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<RevertData>;
