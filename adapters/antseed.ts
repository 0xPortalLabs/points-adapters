import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";
import { formatUnits } from "viem";

const PARTICIPANT_URL = await maybeWrapCORSProxy(
  "https://antseedpoints.com/api/antscan/api/staking/participants/{address}?epochs=1",
);
const GRAPHQL_URL = await maybeWrapCORSProxy(
  "https://antseedpoints.com/api/antscan/graphql",
);

const headers = {
  "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
};

type EpochPoints = {
  epoch: string;
  weightedPoints: string;
  volumeUsdc: string;
};

type Participant = {
  currentEpoch: string;
  buyer: EpochPoints[];
  seller: EpochPoints[];
};

type PointsResponse = {
  epoch: number;
  points: number;
  providerPoints: number;
  spent: number;
  rank: number;
};

// Match the frontend's weighted-points conversion: 24 decimals / (10,000 * 104).
const toPoints = (value: string) =>
  Number(formatUnits(BigInt(value), 24)) / (10_000 * 104);

export default {
  fetch: async (address: string): Promise<PointsResponse> => {
    const res = await fetch(
      PARTICIPANT_URL.replace("{address}", address.toLowerCase()),
      { headers },
    );

    if (!res.ok) {
      throw new Error(`AntSeed points: HTTP ${res.status}`);
    }

    const participant: Participant = await res.json();
    const buyer = participant.buyer.find(
      (row) => row.epoch === participant.currentEpoch,
    );
    const seller = participant.seller.find(
      (row) => row.epoch === participant.currentEpoch,
    );
    const weightedPoints = buyer?.weightedPoints ?? "0";
    let rank = 0;

    if (BigInt(weightedPoints) > 0n) {
      const rankRes = await fetch(GRAPHQL_URL, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query($e: BigInt!, $w: BigInt!) {
            above: buyerEpochs(where: { epoch: $e, weightedPoints_gt: $w }, limit: 1) {
              totalCount
            }
          }`,
          variables: { e: participant.currentEpoch, w: weightedPoints },
        }),
      });

      if (!rankRes.ok) {
        throw new Error(`AntSeed rank: HTTP ${rankRes.status}`);
      }

      const result = await rankRes.json();
      rank = result.data.above.totalCount + 1;
    }

    return {
      epoch: Number(participant.currentEpoch),
      points: toPoints(weightedPoints),
      providerPoints: toPoints(seller?.weightedPoints ?? "0"),
      spent: Number(formatUnits(BigInt(buyer?.volumeUsdc ?? "0"), 6)),
      rank,
    };
  },
  data: (data: PointsResponse) => ({
    Epoch: data.epoch,
    "Buyer Points This Week": data.points,
    "Provider Points This Week": data.providerPoints,
    "Spent This Week (USDC)": data.spent,
    Rank: data.rank,
  }),
  total: (data: PointsResponse) => data.points,
  rank: (data: PointsResponse) => data.rank,
  supportedAddressTypes: ["evm"],
} satisfies AdapterExport<PointsResponse>;
