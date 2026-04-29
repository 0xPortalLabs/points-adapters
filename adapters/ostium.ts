import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const USER_POINTS_URL = await maybeWrapCORSProxy(
  "https://onlypoints.ostium.io/api/points/user/{address}"
);

const SEASONS_URL = await maybeWrapCORSProxy(
  "https://onlypoints.ostium.io/api/seasons"
);

const headers = {
  "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
};

type Season = {
  id: string;
  name: string;
  status: "active" | "completed" | "upcoming" | string;
  seasonGroup: number;
  startTime: number;
  endTime: number;
};

type SeasonPoint = {
  seasonId: string;
  points: number;
  rank: number;
  breakdown?: {
    trading?: number;
    lp?: number;
  };
};

type UserPointsResponse = {
  userId: string;
  totalPoints: number;
  preSeasonPoints: number;
  bountyPoints: number;
  rank: number;
  seasonPoints: SeasonPoint[];
};

type RawAPIResponse = {
  user: UserPointsResponse;
  seasons: Season[];
};

type SeasonData = {
  grouped: Record<string, Record<string, number>>;
  totals: Record<string, number>;
  unmappedPoints: number;
};

type API_RESPONSE = RawAPIResponse & {
  seasonData: SeasonData;
};

const emptyUser = (address: string): UserPointsResponse => ({
  userId: address,
  totalPoints: 0,
  preSeasonPoints: 0,
  bountyPoints: 0,
  rank: 0,
  seasonPoints: [],
});

const seasonPointsKey = (seasonGroup: number) => `Season ${seasonGroup} Points`;

const deprecatedBySeasonGroup = (seasons: Season[]) => {
  const activeSeason = seasons.find((season) => season.status === "active");
  let currentSeasonGroup = activeSeason?.seasonGroup ?? 0;

  if (!activeSeason) {
    for (const season of seasons) {
      if (season.seasonGroup > currentSeasonGroup) {
        currentSeasonGroup = season.seasonGroup;
      }
    }
  }

  const deprecated: Record<string, number> = {};

  for (const season of seasons) {
    if (season.seasonGroup >= currentSeasonGroup) continue;

    const key = seasonPointsKey(season.seasonGroup);
    deprecated[key] = Math.max(deprecated[key] ?? 0, season.endTime);
  }

  return deprecated;
};

const buildSeasonData = (data: RawAPIResponse): SeasonData => {
  const seasons = new Map<string, Season>();
  const grouped: Record<string, Record<string, number>> = {};
  const totals: Record<string, number> = {};
  let unmappedPoints = 0;

  for (const season of data.seasons) {
    seasons.set(season.id, season);

    const key = seasonPointsKey(season.seasonGroup);
    grouped[key] ??= { "Total Points": 0 };
    totals[key] ??= 0;
  }

  for (const seasonPoint of data.user.seasonPoints ?? []) {
    const season = seasons.get(seasonPoint.seasonId);
    if (!season) {
      unmappedPoints += seasonPoint.points;
      continue;
    }

    const key = seasonPointsKey(season.seasonGroup);

    totals[key] = (totals[key] ?? 0) + seasonPoint.points;
    grouped[key] ??= { "Total Points": 0 };
    grouped[key]["Total Points"] += seasonPoint.points;
    grouped[key][season.name] =
      (grouped[key][season.name] ?? 0) + seasonPoint.points;
  }

  if (data.user.preSeasonPoints > 0) {
    totals["Preseason Points"] = data.user.preSeasonPoints;
  }

  if (data.user.bountyPoints > 0) {
    totals["Bounty Points"] = data.user.bountyPoints;
  }

  return { grouped, totals, unmappedPoints };
};

export default {
  fetch: async (address) => {
    address = address.toLowerCase();

    const [userResponse, seasonsResponse] = await Promise.all([
      fetch(USER_POINTS_URL.replace("{address}", address), {
        headers,
      }),
      fetch(SEASONS_URL, { headers }),
    ]);

    if (!userResponse.ok && userResponse.status !== 404) {
      throw new Error(
        `Ostium user points request failed with status ${userResponse.status}`
      );
    }

    if (!seasonsResponse.ok) {
      throw new Error(
        `Ostium seasons request failed with status ${seasonsResponse.status}`
      );
    }

    const [user, seasons] = await Promise.all([
      userResponse.status === 404
        ? emptyUser(address)
        : (userResponse.json() as Promise<UserPointsResponse>),
      seasonsResponse.json() as Promise<Season[]>,
    ]);

    return { user, seasons, seasonData: buildSeasonData({ user, seasons }) };
  },
  data: (data: API_RESPONSE) => {
    const output: Record<string, Record<string, number>> = data.seasonData
      .grouped;

    for (const key of Object.keys(deprecatedBySeasonGroup(data.seasons))) {
      output[key] ??= { "Total Points": 0 };
    }

    if (
      data.user.totalPoints > 0 ||
      data.user.preSeasonPoints > 0 ||
      data.user.bountyPoints > 0 ||
      data.seasonData.unmappedPoints > 0
    ) {
      output["Summary"] = {
        "Total Points": data.user.totalPoints,
        Rank: data.user.rank,
        "Preseason Points": data.user.preSeasonPoints,
        "Bounty Points": data.user.bountyPoints,
        "Unmapped Season Points": data.seasonData.unmappedPoints,
      };
    }

    return output;
  },
  total: (data: API_RESPONSE) => {
    const totals = data.seasonData.totals;
    return Object.keys(totals).length > 0 ? totals : data.user.totalPoints;
  },
  rank: (data: API_RESPONSE) => data.user.rank,
  deprecated: (data: API_RESPONSE) => deprecatedBySeasonGroup(data.seasons),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
