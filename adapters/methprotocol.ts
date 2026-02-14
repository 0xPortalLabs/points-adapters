import type { AdapterExport } from "../utils/adapter.ts";

const API_URL = "https://cmeth-api-v2.mantle.xyz/points/{address}";

/**
{
  message: "ok",
  code: 0,
  data: {
    walletAddress: "0x7044c9382e76b6a32a817a5156a36b9fbcefb61e",
    totalPoints: 809.8082442002403,
    tokenPoints: 809.8082442002403,
    referralPoints: 0,
    rank: "5035",
    referralRank: "46370",
    date: "2025-02-12",
    l2Points: 809.8082442002403,
    methAmount: 0,
    cmethAmount: 20.956417664487045,
  },
}
   */
export default {
  fetch: async (address: string) => {
    const res = await fetch(
      API_URL.replace("{address}", address.toLowerCase()),
      {
        headers: {
          "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
        },
      }
    );
    const data = await res.json();
    return data.data;
  },
  data: (data: Record<string, string | number> | null) => {
    return data
      ? {
          "Total Points": data.totalPoints,
          "Token Points": data.tokenPoints,
          "Referral Points": data.referralPoints,
          Rank: data.rank,
          "Referral Rank": data.referralRank,
          Date: data.date,
          "L2 Points": data.l2Points,
          "mETH Amount": data.methAmount,
          "cmETH Amount": data.cmethAmount,
        }
      : {};
  },
  total: (data: { totalPoints?: number } | null) => data?.totalPoints ?? 0,
  rank: (data: { rank?: string }) => parseInt(data?.rank || "0"),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
