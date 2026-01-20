import type { AdapterExport } from "../utils/adapter.ts";

const API_URL = "https://api.maple.finance/v2/graphql";

const req = {
  operationName: "getPortfolioData",
  variables: {
    account: "",
    accountId: "",
  },
  query:
    "query getPortfolioData($account: String!, $accountId: ID!, $poolIds: [String!]) {\n  poolV2Positions(where: {pool_: {syrupRouter_not: null}, account: $account}) {\n    ...PoolV2Position\n    __typename\n  }\n  poolV2S(where: {syrupRouter_not: null}) {\n    ...PoolWithdrawal\n    __typename\n  }\n  txes(\n    where: {poolV2_: {syrupRouter_not: null}, account: $account}\n    first: 1000\n    orderBy: timestamp\n    orderDirection: desc\n  ) {\n    ...BasicTransaction\n    __typename\n  }\n  accountById(id: $accountId) {\n    dripsEarned\n    lendingApy(poolIds: $poolIds)\n    __typename\n  }\n}\n\nfragment PoolV2Position on PoolV2Position {\n  id\n  shares\n  lockedShares\n  totalShares\n  availableBalance\n  availableShares\n  lendingBalance\n  interestEarned\n  dripsEarned\n  pool {\n    asset {\n      ...Asset\n      __typename\n    }\n    apyData {\n      ...ApyData\n      __typename\n    }\n    poolMeta {\n      targetYield\n      __typename\n    }\n    __typename\n  }\n  commitments {\n    ...Commitment\n    __typename\n  }\n  __typename\n}\n\nfragment Asset on Asset {\n  decimals\n  id\n  symbol\n  __typename\n}\n\nfragment ApyData on ApyData {\n  apy\n  __typename\n}\n\nfragment Commitment on Commitment {\n  id\n  amount\n  days\n  date\n  depositTxes\n  dripsEarned\n  dripsPerDay\n  isWithdrawnEarly\n  withdrawnAmount\n  withdrawnShares\n  shares\n  createdAt\n  updatedAt\n  __typename\n}\n\nfragment PoolWithdrawal on PoolV2 {\n  id\n  name\n  accountedInterest\n  assets\n  asset {\n    ...Asset\n    __typename\n  }\n  domainEnd\n  domainStart\n  id\n  issuanceRate\n  loanManager {\n    ...LoanManager\n    __typename\n  }\n  name\n  openTermLoanManager {\n    ...OpenTermLoanManager\n    __typename\n  }\n  principalOut\n  shares\n  withdrawalManagerQueue {\n    ...WithdrawalManagerQueue\n    __typename\n  }\n  unrealizedLosses\n  __typename\n}\n\nfragment LoanManager on LoanManager {\n  id\n  issuanceRate\n  accountedInterest\n  domainStart\n  domainEnd\n  principalOut\n  __typename\n}\n\nfragment OpenTermLoanManager on OpenTermLoanManager {\n  id\n  issuanceRate\n  accountedInterest\n  domainStart\n  domainEnd\n  principalOut\n  __typename\n}\n\nfragment WithdrawalManagerQueue on WithdrawalManagerQueue {\n  id\n  version\n  pool {\n    id\n    __typename\n  }\n  requests {\n    ...WithdrawalRequest\n    __typename\n  }\n  totalShares\n  lastRequest {\n    ...WithdrawalRequest\n    __typename\n  }\n  nextRequest {\n    ...WithdrawalRequest\n    __typename\n  }\n  __typename\n}\n\nfragment WithdrawalRequest on WithdrawalRequest {\n  id\n  owner\n  initialShares\n  processedShares\n  shares\n  status\n  createdAt\n  processedAt\n  cancelledAt\n  __typename\n}\n\nfragment BasicTransaction on Tx {\n  id\n  amount\n  value\n  symbol\n  type\n  timestamp\n  transaction {\n    id\n    __typename\n  }\n  __typename\n}",
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
            "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
        },
      })
    ).json();
    return res.data.accountById;
  },
  data: (data: { dripsEarned: number; lendingApy: string }) => ({
    Drips: {
      "Drips Earned": data.dripsEarned,
      "Lending APY": data.lendingApy,
    },
  }),
  total: (data: { dripsEarned: number }) => ({ Drips: data.dripsEarned }),
} as AdapterExport;
