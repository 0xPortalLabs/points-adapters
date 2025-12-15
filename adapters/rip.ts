import { fidFromAddress } from "../utils/farcaster.ts";
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";
import { getAddress } from "viem";
import { convertKeysToStartCase } from "../utils/object.ts";

const API_URL = await maybeWrapCORSProxy("https://rips.app/api/users/{fid}");
const leaderboard = await maybeWrapCORSProxy(
  "https://rips.app/api/rankings?page=0&limit=20000",
);

type DATA_TYPE = {
  stats: Record<string, number>;
  points: Record<string, number | string>;
  rank: number;
};

export default {
  fetch: async (address) => {
    const header = {
      headers: {
        Authorization:
          "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjM1NWQ0M2JmLWM0YjQtNDVlMy04MmNhLThlYjI4YzY3MDllNSJ9.eyJpYXQiOjE3NjU4MzUwNTEsImlzcyI6Imh0dHBzOi8vYXV0aC5mYXJjYXN0ZXIueHl6IiwiZXhwIjoxNzY1ODM4NjUxLCJzdWIiOjE2MTE3MjEsImF1ZCI6InJpcHMuYXBwIn0.GFBnSs0UyKrMDzRDsZ2iDoQpaaVdd1gvF3-wMe74yQVJ76-g2BHHHVhWm6yzF9L-sF6iIxPnCYgRPSbt4p5yteEN3RQZMhe_9SCOiPlb41TfdaCoJoW0wePxvDP7HndBXQNDj1vDGy8aGxBXeQZ2UlObvFGeFpPQNh5uVorHxw2_F9-uAEinR2pDUQflAYTHEDqSKYfPHPsBBTuE0Yz1ZQ7K3PupxVa-g7pN9MprKnvaGbT8PDEnzwMkHiZ8h3XrYW-l76eQz1Nj-Octxz9cau6JDKOQRYS-x1mM_--VXxipJo6gUCC7tJ2AqIH4f_SkYKA__Sj6BfIqwvcnKERvQA",
      },
    };
    const fid = await fidFromAddress(getAddress(address));
    const res_points = await fetch(
      API_URL.replace("{fid}", String(fid)),
      header,
    );
    const res_stats = await fetch(
      API_URL.replace("{fid}", String(fid)) + "/stats",
      header,
    );
    const rank = await fetch(leaderboard, header);
    const rank_data = await rank.json();
    return {
      stats: (await res_stats.json()).stats,
      points: await res_points.json(),
      rank: rank_data.users.find(
        (obj: Record<string, number | string>) => obj.fid === Number(fid),
      ).rank,
    };
  },
  data: (data: DATA_TYPE) => {
    const { Id, Fid, profileImageUrl, ...rest } = data.points;
    return convertKeysToStartCase({
      ...rest,
      ...data.stats,
      Rank: data.rank,
      isAdmin: data.points.isAdmin ? "Yes" : "No",
    });
  },
  total: (data: DATA_TYPE) => ({
    "Rips Points": data.points.ripsPoints,
  }),
  rank: (data: DATA_TYPE) => data.rank,
} as AdapterExport;
