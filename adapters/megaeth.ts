import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const LEADERBOARD_URL = await maybeWrapCORSProxy(
  "https://terminal.megaeth.com/leaderboard"
);

const headers = {
  "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

type LeaderboardEntry = {
  rank: number;
  xAccount?: string;
  mainWalletAddress: string;
  totalPoints: number;
  weeklyPointsChange: number;
};

type AdapterResponse = {
  address: string;
  weekly?: LeaderboardEntry;
  allTime?: LeaderboardEntry;
};

type LeaderboardBounds = {
  weeklyStart: number;
  allStart: number;
};

// The leaderboard data is embedded in the HTML as escaped JSON. Only parse the
// two entries we need instead of materializing both full leaderboard arrays.
const findLeaderboardBounds = (html: string): LeaderboardBounds => {
  const weeklyStart = html.indexOf('\\"weekly\\":[');
  const allStart = html.indexOf('\\"all\\":[', weeklyStart);

  if (weeklyStart === -1 || allStart === -1) {
    throw new Error("failed to parse megaeth leaderboard data");
  }

  return { weeklyStart, allStart };
};

const findEntryInSection = (
  html: string,
  lowerCaseAddress: string,
  sectionStart: number,
  searchEnd: number
): LeaderboardEntry | undefined => {
  const addressStart = html.indexOf(lowerCaseAddress, sectionStart);

  if (addressStart === -1 || addressStart > searchEnd) return undefined;

  const entryStart = html.lastIndexOf('{\\"rank\\":', addressStart);
  const entryEnd = html.indexOf("}", addressStart);
  if (entryStart === -1 || entryEnd === -1 || entryStart < sectionStart) {
    throw new Error("failed to parse megaeth leaderboard entry");
  }

  const entry = html.slice(entryStart, entryEnd + 1).replace(/\\"/g, '"');
  return JSON.parse(entry) as LeaderboardEntry;
};

const readLeaderboardEntries = async (
  res: Response,
  lowerCaseAddress: string
): Promise<Pick<AdapterResponse, "weekly" | "allTime">> => {
  const html = await res.text();
  const { weeklyStart, allStart } = findLeaderboardBounds(html);

  return {
    weekly: findEntryInSection(html, lowerCaseAddress, weeklyStart, allStart),
    allTime: findEntryInSection(html, lowerCaseAddress, allStart, html.length),
  };
};

export default {
  fetch: async (address: string) => {
    const res = await fetch(LEADERBOARD_URL, { headers });

    if (!res.ok) throw new Error("megaeth api error: " + res.statusText);

    const lowerCaseAddress = address.toLowerCase();
    const entries = await readLeaderboardEntries(res, lowerCaseAddress);

    return {
      address,
      ...entries,
    };
  },
  data: (data: AdapterResponse) => ({
    "Total Points": data.allTime?.totalPoints ?? data.weekly?.totalPoints ?? 0,
    Rank: data.allTime?.rank ?? 0,
    "Weekly Points": data.weekly?.weeklyPointsChange ?? 0,
    "Weekly Rank": data.weekly?.rank ?? 0,
  }),
  total: (data: AdapterResponse) =>
    data.allTime?.totalPoints ?? data.weekly?.totalPoints ?? 0,
  rank: (data: AdapterResponse) => data.allTime?.rank ?? 0,
  supportedAddressTypes: ["evm"],
} as AdapterExport;
