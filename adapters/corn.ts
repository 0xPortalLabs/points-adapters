import type { AdapterExport } from "../utils/adapter.ts";

const API_URL = "https://api.usecorn.com/api/v1/kernels/balance/{address}";

/*
{
  balance: "1562957.092",
  kernelsPerSec: "3.974207",
  kernelsPerBlock: "0.000000",
  turbo: "1.000000",
}
 */
export default {
  fetch: async (address: string) => {
    return (await fetch(API_URL.replace("{address}", address))).json();
  },
  points: (data: Record<string, string>) => ({
    Kernels: {
      balance: parseFloat(data.balance),
      kernelsPerSec: parseFloat(data.kernelsPerSec),
      kernelsPerBlock: parseFloat(data.kernelsPerBlock),
      turbo: parseFloat(data.turbo),
    },
  }),
  total: (data: Record<string, string>) => ({
    Kernels: parseFloat(data.balance),
  }),
} as AdapterExport;
