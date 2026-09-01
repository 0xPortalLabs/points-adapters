import type { AdapterExport } from "../utils/adapter.ts";
import {
  convertKeysToStartCase,
  convertValuesToNormal,
} from "../utils/object.ts";

const TASK_API_URL = "https://affiliate-api-eosin.vercel.app/api/v1/task";

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

const toNumber = (value: unknown): number => {
  const numericValue = Number(value ?? 0);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const getCompletedDiamonds = (quests: Quest[]): number =>
  quests.reduce((total, quest) => total + toNumber(quest.rewards), 0);

const getLockedDiamonds = (quests: Quest[]): number =>
  quests.reduce((total, quest) => total + toNumber(quest.locked), 0);

const getTotalDiamonds = (data: API_RESPONSE): number =>
  data.earnedDiamonds ?? getCompletedDiamonds(data.quests);

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const hasOptionalString = (value: Record<string, unknown>, key: string) =>
  value[key] === undefined || typeof value[key] === "string";

const hasOptionalNumericString = (
  value: Record<string, unknown>,
  key: string,
) => {
  const field = value[key];
  return field === undefined ||
    (typeof field === "string" &&
      field.trim() !== "" &&
      Number.isFinite(Number(field)));
};

const isQuestTask = (value: unknown): value is QuestTask =>
  isObject(value) &&
  hasOptionalString(value, "title") &&
  hasOptionalString(value, "rewards") &&
  hasOptionalString(value, "status");

const isQuest = (value: unknown): value is Quest =>
  isObject(value) &&
  hasOptionalString(value, "title") &&
  hasOptionalNumericString(value, "rewards") &&
  hasOptionalNumericString(value, "locked") &&
  (value.tasks === undefined ||
    (Array.isArray(value.tasks) && value.tasks.every(isQuestTask)));

const fetchBedrock = async (
  path: "earned" | "all",
  address: string,
  requestName: string,
): Promise<unknown> => {
  const url = new URL(`${TASK_API_URL}/${path}`);
  url.searchParams.set("addr", address.toLowerCase());

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
    },
  });

  if (!res.ok) {
    throw new Error(
      `Bedrock ${requestName} request failed with status ${res.status}`,
    );
  }

  if (!res.headers.get("content-type")?.includes("json")) {
    throw new Error(`Bedrock ${requestName} request returned non-JSON content`);
  }

  try {
    return await res.json();
  } catch (error) {
    const details = error instanceof Error ? `: ${error.message}` : "";
    throw new Error(
      `Bedrock ${requestName} request returned invalid JSON${details}`,
      { cause: error },
    );
  }
};

export default {
  fetch: async (address: string): Promise<API_RESPONSE> => {
    const [earnedResponse, questsResponse] = await Promise.all([
      fetchBedrock("earned", address, "earned Diamonds"),
      fetchBedrock("all", address, "quests"),
    ]);

    if (
      !isObject(earnedResponse) ||
      earnedResponse.code !== 200 ||
      typeof earnedResponse.message !== "string" ||
      !isObject(earnedResponse.data)
    ) {
      throw new Error(
        "Bedrock earned Diamonds request returned malformed data",
      );
    }

    const earnedDiamonds = earnedResponse.data.diamonds;
    if (
      typeof earnedDiamonds !== "string" &&
      typeof earnedDiamonds !== "number"
    ) {
      throw new Error(
        "Bedrock earned Diamonds request returned malformed data",
      );
    }
    const earnedDiamondsNumber = Number(earnedDiamonds);
    if (!Number.isFinite(earnedDiamondsNumber)) {
      throw new Error(
        "Bedrock earned Diamonds request returned malformed data",
      );
    }

    if (
      !isObject(questsResponse) ||
      questsResponse.code !== 200 ||
      typeof questsResponse.message !== "string"
    ) {
      throw new Error("Bedrock quests request returned malformed data");
    }
    const quests = questsResponse.data;
    if (!Array.isArray(quests) || !quests.every(isQuest)) {
      throw new Error("Bedrock quests request returned malformed data");
    }

    return {
      ...emptyResponse(),
      earnedDiamonds: earnedDiamondsNumber,
      quests,
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
