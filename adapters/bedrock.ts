import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";
import {
  convertKeysToStartCase,
  convertValuesToNormal,
} from "../utils/object.ts";

const EARNED_URL = await maybeWrapCORSProxy(
  "https://app.bedrock.technology/api/v2/bedrock/task/earned",
);
const QUESTS_URL = await maybeWrapCORSProxy(
  "https://app.bedrock.technology/api/v2/bedrock/task/list",
);

type QuestTask = {
  title?: string;
  rewards?: string;
  status?: string;
};

type Quest = {
  title?: string;
  rewards?: string;
  locked?: string;
  tasks?: QuestTask[];
};

type API_RESPONSE = {
  earnedDiamonds?: number;
  quests: Quest[];
};

const emptyResponse = (): API_RESPONSE => ({ quests: [] });

const toNumber = (value: unknown): number =>
  parseFloat(String(value ?? "")) ||
  0;

const getCompletedDiamonds = (quests: Quest[]): number =>
  quests.reduce((total, quest) => total + toNumber(quest.rewards), 0);

const getLockedDiamonds = (quests: Quest[]): number =>
  quests.reduce((total, quest) => total + toNumber(quest.locked), 0);

const getTotalDiamonds = (data: API_RESPONSE): number =>
  data.earnedDiamonds ?? getCompletedDiamonds(data.quests);

const postBedrock = async <T>(
  url: string,
  address: string,
): Promise<T | undefined> => {
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify({ address: address.toLowerCase() }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
    },
  });

  if (!res.ok || !res.headers.get("content-type")?.includes("json")) {
    return undefined;
  }

  return await res.json().catch(() => undefined) as T | undefined;
};

export default {
  fetch: async (address: string): Promise<API_RESPONSE> => {
    const [earnedResponse, questsResponse] = await Promise.all([
      postBedrock<{ data?: { diamonds?: string | number } }>(
        EARNED_URL,
        address,
      ),
      postBedrock<{ data?: Quest[] }>(QUESTS_URL, address),
    ]);

    return {
      ...emptyResponse(),
      earnedDiamonds: earnedResponse?.data?.diamonds === undefined
        ? undefined
        : toNumber(earnedResponse.data.diamonds),
      quests: questsResponse?.data ?? [],
    };
  },
  data: (data: API_RESPONSE) => ({
    Diamonds: convertKeysToStartCase(convertValuesToNormal({
      earned: getTotalDiamonds(data),
      locked: getLockedDiamonds(data.quests),
      ...Object.fromEntries(
        data.quests.map((quest) => [
          quest.title ?? "Quest",
          {
            earned: toNumber(quest.rewards),
            locked: toNumber(quest.locked),
            ...(quest.tasks
              ? Object.fromEntries(
                quest.tasks.map((task) => [
                  task.title ?? "Task",
                  task.status ?? "Unknown",
                ]),
              )
              : {}),
          },
        ]),
      ),
    })),
  }),
  total: (data: API_RESPONSE) => ({
    Diamonds: getTotalDiamonds(data),
  }),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
