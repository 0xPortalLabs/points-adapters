import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://persephone.superform.xyz/v1/rewards/summary/{address}?epoch={epoch}"
);

const CHECKPOINT_USER_AGENT = "Checkpoint API (https://checkpoint.exchange)";

type SuperformSummary = {
  user: {
    points: number;
    points_per_day: number;
    referrals_direct: number;
    referrals_indirect: number;
    rank: string;
  };
  season_1?: { user_points: number };
  season_2?: { user_points: number };
};

type SuperformFetchResponse = {
  epoch2: SuperformSummary;
  epoch1: SuperformSummary;
  epoch0: SuperformSummary;
};

export default {
  fetch: async (address: string): Promise<SuperformFetchResponse> => {
    const fetchSummary = async (epoch: number): Promise<SuperformSummary> => {
      const url = API_URL.replace("{address}", address).replace(
        "{epoch}",
        String(epoch)
      );

      return await (
        await fetch(url, {
          headers: {
            "User-Agent": CHECKPOINT_USER_AGENT,
          },
        })
      ).json();
    };

    const [epoch2, epoch1, epoch0] = await Promise.all([
      fetchSummary(2),
      fetchSummary(1),
      fetchSummary(0),
    ]);

    return { epoch2, epoch1, epoch0 };
  },
  data: ({ epoch2, epoch1, epoch0 }: SuperformFetchResponse) => ({
    "S3 Epoch 2 Points": epoch2.user.points,
    "S3 Points": epoch2.user.points,
    "S2 Cred": epoch2.season_2?.user_points ?? 0,
    "S1 XP": epoch2.season_1?.user_points ?? 0,
    "S3 Epoch 1 Points": epoch1.user.points,
    "S3 Epoch 0 Points": epoch0.user.points,
    "Points Per Day": epoch2.user.points_per_day,
    "Referrals Direct": epoch2.user.referrals_direct,
    "Referrals Indirect": epoch2.user.referrals_indirect,
  }),
  total: ({ epoch2 }: SuperformFetchResponse) => ({
    "S3 Points": epoch2.user.points,
  }),
  rank: ({ epoch2 }: SuperformFetchResponse) => Number(epoch2.user.rank),
  supportedAddressTypes: ["evm"],
} as AdapterExport;
