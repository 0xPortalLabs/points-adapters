import { getAddress } from "viem";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";
import { convertKeysToStartCase } from "../utils/object.ts";

const date = Date.now();

const API_URL = await maybeWrapCORSProxy(
  `https://basearoundtheworld.vercel.app/api/player?address={address}&_t=${date}`,
);

type API_RESPONSE = {
  player: {
    name: string;
    totalScore: number;
    levelsCompleted: number;
    bestLevel: number;
    referralRewarded: boolean;
  };
  progress: Array<Record<string, string | number>>;
};
export default {
  fetch: async (address) => {
    const res = await fetch(API_URL.replace("{address}", getAddress(address)));
    const data: API_RESPONSE = await res.json();
    if (!data.player) throw new Error("Player does not exist");
    return data;
  },
  data: (data: API_RESPONSE) => {
    const progressData = data.progress.reduce(
      (acc, obj, index) => {
        const convertedObj = convertKeysToStartCase(obj);
        Object.entries(convertedObj).forEach(([key, value]) => {
          if (key === "Completed At") {
            acc[`Level ${index + 1} ${key}`] = new Date(value).toLocaleString();
          } else {
            acc[`Level ${index + 1} ${key}`] = value;
          }
        });
        return acc;
      },
      {} as Record<string, string | number>,
    );

    return {
      Name: data.player.name,
      "Levels Completed": data.player.levelsCompleted,
      "Best Level": data.player.bestLevel,
      ...progressData,
    };
  },
  total: (data: API_RESPONSE) => data.player.totalScore,
} as AdapterExport;
