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

type API_RESPONSE = {
  user: UserPointsResponse;
  seasons: Season[];
};

const emptyUser = (address: string): UserPointsResponse => ({
  userId: address,
  totalPoints: 0,
  preSeasonPoints: 0,
  bountyPoints: 0,
  rank: 0,
  seasonPoints: [],
});

const fetchJson = async <T>(url: string, fallback: T): Promise<T> => {
  const res = await fetch(url, { headers });
  if (!res.ok) return fallback;
  return (await res.json()) as T;
};

const seasonById = (seasons: Season[]) =>
  new Map(seasons.map((season) => [season.id, season]));

const seasonGroupLabel = (season?: Season) =>
  season ? `Season ${season.seasonGroup}` : "Unknown Season";

const totalBySeasonGroup = (data: API_RESPONSE) => {
  const seasons = seasonById(data.seasons);
  const totals: Record<string, number> = {};

  for (const seasonPoint of data.user.seasonPoints ?? []) {
    const season = seasons.get(seasonPoint.seasonId);
    if (!season) continue;

    const key = `${seasonGroupLabel(season)} Points`;
    totals[key] = (totals[key] ?? 0) + seasonPoint.points;
  }

  if (data.user.preSeasonPoints > 0) {
    totals["Preseason Points"] = data.user.preSeasonPoints;
  }

  if (data.user.bountyPoints > 0) {
    totals["Bounty Points"] = data.user.bountyPoints;
  }

  return totals;
};

const unmappedSeasonPoints = (data: API_RESPONSE) => {
  const seasons = seasonById(data.seasons);

  return (data.user.seasonPoints ?? []).reduce((sum, seasonPoint) => {
    return seasons.has(seasonPoint.seasonId) ? sum : sum + seasonPoint.points;
  }, 0);
};

const seasonGroups = (data: API_RESPONSE): Record<string, Record<string, number>> => {
  const seasons = seasonById(data.seasons);
  const grouped: Record<string, Record<string, number>> = {};

  for (const seasonPoint of data.user.seasonPoints ?? []) {
    const season = seasons.get(seasonPoint.seasonId);
    if (!season) continue;

    const seasonLabel = seasonGroupLabel(season);
    const weekLabel = season.name;

    grouped[seasonLabel] ??= {};
    grouped[seasonLabel][weekLabel] =
      (grouped[seasonLabel][weekLabel] ?? 0) + seasonPoint.points;
  }

  return Object.fromEntries(
    Object.entries(grouped)
      .sort(([a], [b]) => {
        const aSeason = Number(a.match(/\d+/)?.[0] ?? 0);
        const bSeason = Number(b.match(/\d+/)?.[0] ?? 0);
        return bSeason - aSeason;
      })
      .map(([seasonLabel, weeks]) => {
        const sortedWeeks = Object.fromEntries(
          Object.entries(weeks).sort(([a], [b]) => {
            const aWeek = Number(a.match(/\d+/)?.[0] ?? 0);
            const bWeek = Number(b.match(/\d+/)?.[0] ?? 0);
            return aWeek - bWeek;
          })
        );

        return [
          seasonLabel,
          {
            "Total Points": Object.values(weeks).reduce(
              (sum, points) => sum + points,
              0
            ),
            ...sortedWeeks,
          },
        ];
      })
  );
};

export default {
  fetch: async (address) => {
    const lowerCaseAddress = address.toLowerCase();

    const [user, seasons] = await Promise.all([
      fetchJson<UserPointsResponse>(
        USER_POINTS_URL.replace("{address}", lowerCaseAddress),
        emptyUser(lowerCaseAddress)
      ),
      fetchJson<Season[]>(SEASONS_URL, []),
    ]);

    return { user, seasons };
  },
  data: (data: API_RESPONSE) => {
    const output: Record<string, Record<string, number>> = seasonGroups(data);

    if (
      data.user.totalPoints > 0 ||
      data.user.preSeasonPoints > 0 ||
      data.user.bountyPoints > 0 ||
      unmappedSeasonPoints(data) > 0
    ) {
      output["Summary"] = {
        "Total Points": data.user.totalPoints,
        Rank: data.user.rank,
        "Preseason Points": data.user.preSeasonPoints,
        "Bounty Points": data.user.bountyPoints,
        "Unmapped Season Points": unmappedSeasonPoints(data),
      };
    }

    return output;
  },
  total: (data: API_RESPONSE) => {
    const totals = totalBySeasonGroup(data);
    return Object.keys(totals).length > 0 ? totals : data.user.totalPoints;
  },
  rank: (data: API_RESPONSE) => data.user.rank,
  deprecated: (data: Partial<API_RESPONSE>) => {
    const seasons = Array.isArray(data.seasons) ? data.seasons : [];
    const activeSeason = seasons.find((season) => season.status === "active");
    const currentSeasonGroup =
      activeSeason?.seasonGroup ??
      Math.max(0, ...seasons.map((season) => season.seasonGroup));

    const deprecatedGroups = seasons.filter(
      (season) => season.seasonGroup < currentSeasonGroup
    );

    return deprecatedGroups.reduce<Record<string, number>>((acc, season) => {
      const key = `Season ${season.seasonGroup} Points`;
      acc[key] = Math.max(acc[key] ?? 0, season.endTime);
      return acc;
    }, {});
  },
  supportedAddressTypes: ["evm"],
} as AdapterExport;
