import type { AdapterExport } from "../utils/adapter.ts";

const API_URL = "https://api.level.money/v1/xp/owner/{address}/grants";

/*
{
  "address": {
    "address": "0x07aF52033A6BE1B80Aa559b63f0c64E5c1d27794",
    "network": "ETHEREUM_MAINNET"
  },
  "balance": {
    "asOf": "2025-03-30T11:09:04.570Z",
    "total": "262231759971",
    "accrued": "175168919602"
  },
  "grants": [
    {
      "id": "8a2fab25-c1f0-48da-a42e-210877396aba",
      "accrualStartAt": "2025-03-27T09:22:35.000Z",
      "accrualEndAt": "2025-04-01T00:00:00.000Z",
      "terminatedAt": null,
      "createdAt": "2025-03-27T09:22:40.692Z",
      "updatedAt": "2025-03-27T09:22:40.692Z",
      "referringGrantId": null,
      "depositContractAddress": "0x65901Ac9EFA7CdAf1Bdb4dbce4c53B151ae8d014",
      "tokenAddress": "0x65901Ac9EFA7CdAf1Bdb4dbce4c53B151ae8d014",
      "balance": {
        "asOf": "2025-03-30T11:09:04.570Z",
        "total": "50663977531",
        "accrued": "33787804007"
      }
    }
    // ... more grants
  ]
}
*/
export default {
  fetch: async (address: string) => {
    return await (await fetch(API_URL.replace("{address}", address))).json();
  },
  data: ({
    balance,
    grants,
  }: {
    balance: { total: string; accrued: string };
    grants: Array<{
      id: string;
      balance: { total: string; accrued: string };
    }>;
  }) => {
    return {
      XP: {
        "Total Earned": balance.accrued,
        ...Object.fromEntries(
          grants.map((grant, index) => [
            `Grant ${index + 1}: ${grant.id}`,
            grant.balance.accrued,
          ])
        ),
      },
    };
  },
  total: ({ balance }: { balance: { accrued: string } }) => ({
    XP: parseInt(balance.accrued),
  }),
} as AdapterExport;
