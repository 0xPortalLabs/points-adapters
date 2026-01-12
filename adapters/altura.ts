import { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";
import { convertKeysToStartCase } from "../utils/object.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://www.altura.trade/api/lootbox/{path}?address={address}",
);

export default {
  fetch: async (address) => {
    const res_points = await fetch(
      API_URL.replace("{address}", address).replace("{path}", "/points"),
    );
    const res_boxes = await fetch(
      API_URL.replace("{address}", address).replace("{path}", "/boxes"),
    );
    return { points: await res_points.json(), boxes: await res_boxes.json() };
  },
  data: (data: { points: { address: string }; boxes: { address: string } }) => {
    const points_boxes = { ...data.points, ...data.boxes };
    const { address, ...rest } = points_boxes;
    return convertKeysToStartCase(rest);
  },
  total: (data: { totalPoints: number }) => data.totalPoints,
} as AdapterExport;
