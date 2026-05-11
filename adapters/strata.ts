import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://api.strata.money/points/stats?accountAddress={address}&season=1&chainId=1"
);

type PointBucket = number | number[] | Record<string, number>;

type StrataPoints = {
  total?: number;
  latest?: number;
  supply?: number;
  referral?: number;
  tranche?: PointBucket;
  pendle?: PointBucket;
  pv2?: PointBucket;
  euler?: PointBucket;
  morpho?: PointBucket;
  ipor?: PointBucket;
  fluid?: PointBucket;
  aave?: PointBucket;
  rewards?: PointBucket;
  sneutrl?: PointBucket;
  pneutrl?: PointBucket;
  pv3?: PointBucket;
  smhyp?: PointBucket;
  smm1?: PointBucket;
  ssat?: PointBucket;
};

type API_RESPONSE = {
  data?: {
    account?: {
      points?: StrataPoints;
      rank?: number;
    };
  };
};

const sumBucket = (bucket: PointBucket | undefined): number => {
  if (typeof bucket === "number") return bucket;
  if (Array.isArray(bucket))
    return bucket.reduce((total, value) => total + value, 0);
  if (bucket && typeof bucket === "object") {
    return Object.values(bucket).reduce((total, value) => total + value, 0);
  }
  return 0;
};

export default {
  fetch: async (address: string) => {
    const normalizedAddress = address.toLowerCase();
    const res = await fetch(API_URL.replace("{address}", normalizedAddress), {
      headers: {
        "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
      },
    });

    if (!res.ok) {
      throw new Error(`Strata points request failed with status ${res.status}`);
    }

    return await res.json();
  },
  data: ({ data }: API_RESPONSE) => {
    const points = data?.account?.points ?? {};

    return {
      Total: points.total ?? 0,
      Latest: points.latest ?? 0,
      Supply: points.supply ?? 0,
      Tranche: sumBucket(points.tranche),
      Pendle: sumBucket(points.pendle),
      "Pendle V2": sumBucket(points.pv2),
      "Pendle V3": sumBucket(points.pv3),
      Euler: sumBucket(points.euler),
      Morpho: sumBucket(points.morpho),
      IPOR: sumBucket(points.ipor),
      Fluid: sumBucket(points.fluid),
      Aave: sumBucket(points.aave),
      Rewards: sumBucket(points.rewards),
      sNeutrl: sumBucket(points.sneutrl),
      pNeutrl: sumBucket(points.pneutrl),
      "Midas mHYPER": sumBucket(points.smhyp),
      "Midas mM1": sumBucket(points.smm1),
      Saturn: sumBucket(points.ssat),
      Referral: points.referral ?? 0,
    };
  },
  total: ({ data }: API_RESPONSE) => data?.account?.points?.total ?? 0,
  rank: ({ data }: API_RESPONSE) => data?.account?.rank ?? 0,
  supportedAddressTypes: ["evm"],
} as AdapterExport;
