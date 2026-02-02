import type { AdapterExport } from "../utils/adapter.ts";
import { convertKeysToStartCase } from "../utils/object.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://trailblazer.mainnet.taiko.xyz/s4/user/rank?address={address}"
);

/*
{
  rank: 3,
  address: "0x1602E644d80036EE566E7893BCE6009FE63dB47a",
  score: 7640957.241653256,
  multiplier: 1,
  totalScore: 7640957.241653256,
  total: 411820,
  blacklisted: false,
  breakdown: [
    { event: "Transaction", total_points: 12347489.875 },
    { event: "TransactionValue", total_points: 12346348.375 },
    { event: "FrozenBonus", total_points: 7032.24336 },
  ],
}
*/
export default {
  fetch: async (address: string) => {
    return await (
      await fetch(API_URL.replace("{address}", address), {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Checkpoint API (https://checkpoint.exchange)",
        },
      })
    ).json();
  },
  data: ({
    multiplier = 1,
    totalScore = 0,
    breakdown = [],
    total = 0,
    score = 0,
    rank = 0,
  }: Record<string, number | Array<Record<string, string | number>>>) => {
    const getPoints = (event: string) =>
      Array.isArray(breakdown)
        ? Number(breakdown.find((x) => x.event === event)?.total_points || 0)
        : 0;

    const events = Array.isArray(breakdown)
      ? breakdown.reduce(
          (
            acc: Record<string, number>,
            item: Record<string, string | number>
          ) => {
            const event = item.event as string;
            acc[`${event} Points`] = getPoints(event);
            return acc;
          },
          {} as Record<string, number>
        )
      : {};

    return convertKeysToStartCase({
      multiplier,
      totalScore,
      score,
      total,
      rank,
      ...events,
    });
  },
  total: ({ totalScore }: Record<string, number>) => totalScore,
  rank: ({ rank }: Record<string, number>) => rank,
} as AdapterExport;
