import type { AdapterExport } from "../utils/adapter.ts";

const API_URL = "https://api.maple.finance/v2/graphql";

const req = {
  operationName: "getPortfolioData",
  variables: {
    account: "",
    accountId: "",
  },
  extensions: {
    persistedQuery: {
      version: 1,
      sha256Hash:
        "21c589216ddf06fda44752bda59f6caba92d38ca3a473090fe200f797f09bcfb",
    },
  },
};

export default {
  fetch: async (address: string) => {
    req.variables.account = req.variables.accountId = address;

    const res = await (
      await fetch(API_URL.replace("{address}", address), {
        method: "POST",
        body: JSON.stringify(req),
        headers: {
          "content-type": "application/json",
        },
      })
    ).json();
    return res.data.accountById;
  },
  points: (data: { dripsEarned: number; lendingApy: string }) => {
    return {
      dripsEarned: data.dripsEarned,
      lendingApy: data.lendingApy,
    };
  },
  total: (data: { dripsEarned: number }) => data.dripsEarned,
} as AdapterExport;
