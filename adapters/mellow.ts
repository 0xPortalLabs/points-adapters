import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";
import { convertKeysToStartCase } from "../utils/object.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://points.mellow.finance/v1/users/{address}",
);

type DATA_TYPE = {
  chain_id: number;
  user_address: string;
  user_referal_points: string;
  user_vault_balance: string;
  timestamp: number;
  vault_address: string;
  user_mellow_points: string;
  user_symbiotic_points: string;
  user_dittonetwork_points?: string;
  user_kalypso_points?: string;
  user_primev_points?: string;
  user_merits_points: string;
};

export default {
  fetch: async (address: string) => {
    const res = await fetch(API_URL.replace("{address}", address), { headers: { Host: "points.mellow.finance", Accept: "*/*", "User-Agent": "Checkpoint API (https://checkpoint.exchange)" } });
    if (!res.ok)
      throw new Error(`Failed to retrieve mellow data: ${await res.text()}`);
    return await res.json();
  },
  data: (data: DATA_TYPE[]) =>
    convertKeysToStartCase(
      data.reduce(
        (acc, curr) => {
          acc.user_referal_points += Number(curr.user_referal_points);
          acc.user_mellow_points += Number(curr.user_mellow_points);
          acc.user_vault_balance += Number(curr.user_vault_balance);
          acc.user_symbiotic_points += Number(curr.user_symbiotic_points);
          acc.user_dittonetwork_points +=
            Number(curr.user_dittonetwork_points) || 0;
          acc.user_kalypso_points += Number(curr.user_kalypso_points || 0);
          acc.user_primev_points += Number(curr.user_primev_points || 0);
          acc.user_merits_points += Number(curr.user_merits_points) || 0;
          return acc;
        },
        {
          user_referal_points: 0,
          user_mellow_points: 0,
          user_vault_balance: 0,
          user_symbiotic_points: 0,
          user_dittonetwork_points: 0,
          user_kalypso_points: 0,
          user_primev_points: 0,
          user_merits_points: 0,
        },
      ),
    ),
  total: (data: DATA_TYPE[]) =>
    data.reduce((acc, curr) => (acc += Number(curr.user_mellow_points)), 0),
} as AdapterExport;
