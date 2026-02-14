import { getAddress } from "viem";
import { titleCase } from "text-case";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://basearoundtheworld.vercel.app/api/player?address={address}&_t={timestamp}",
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
    const timestamp = Date.now().toString();
    const res = await fetch(
      API_URL.replace("{address}", getAddress(address)).replace(
        "{timestamp}",
        timestamp,
      ),
      {
        headers: {
          "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
        },
      },
    );
    const data: API_RESPONSE = await res.json();
    if (!data.player) {
      return {
        player: {
          name: "Unknown user",
          totalScore: 0,
          levelsCompleted: 0,
          bestLevel: 0,
        },
        progress: [],
      };
    }
    return data;
  },
  data: (data: API_RESPONSE) => {
    const progressData: Record<string, string | number> = {};
    const { progress } = data;

    for (let index = 0; index < progress.length; index++) {
      const obj = progress[index];
      const levelPrefix = `Level ${index + 1} `;

      for (const rawKey in obj) {
        const titledKey = titleCase(rawKey);
        const rawValue = obj[rawKey];
        const outputKey = `${levelPrefix}${titledKey}`;

        if (titledKey === "Completed At") {
          progressData[outputKey] = new Date(rawValue).toLocaleString();
        } else {
          progressData[outputKey] = rawValue;
        }
      }
    }

    return {
      Name: data.player.name,
      "Levels Completed": data.player.levelsCompleted,
      "Best Level": data.player.bestLevel,
      ...progressData,
    };
  },
  total: (data: API_RESPONSE) => data.player.totalScore,
  supportedAddressTypes: ["evm"],
} as AdapterExport;
