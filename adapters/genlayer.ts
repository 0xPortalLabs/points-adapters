import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://portal-admin.genlayer.foundation/api/v1/glp/users/{address}/"
);

type GenLayerGLPAmount = {
  amount: string;
  amount_floor: number;
};

type GenLayerGLPResponse = {
  state?: string;
  total?: GenLayerGLPAmount | null;
  builder?: GenLayerGLPAmount | null;
  community?: GenLayerGLPAmount | null;
  general?: GenLayerGLPAmount | null;
  claimable?: (GenLayerGLPAmount & { expires_at?: string | null }) | null;
  allocated?: GenLayerGLPAmount | null;
  rank?: number | null;
  ranking_scope?: string;
  ranking_is_preseason?: boolean;
  latest_delta?: {
    run_id: number;
    glp_amount: string;
    bp: number;
    cp: number;
  } | null;
};

const getAmount = (value?: GenLayerGLPAmount | null): number =>
  Number(value?.amount ?? 0) || 0;

export default {
  fetch: async (address: string): Promise<GenLayerGLPResponse> => {
    const res = await fetch(
      API_URL.replace("{address}", address.toLowerCase()),
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Checkpoint API (https://checkpoint.exchange)",
        },
      }
    );

    // Unregistered wallets have no GLP profile.
    if (res.status === 404) return {};

    if (!res.ok) {
      throw new Error(`GenLayer GLP request failed with status ${res.status}`);
    }

    return res.json();
  },
  data: (data: GenLayerGLPResponse) => ({
    GLP: {
      "Builder GLP": getAmount(data.builder),
      "Community GLP": getAmount(data.community),
      "General GLP": getAmount(data.general),
      "Claimable GLP": getAmount(data.claimable),
      "Allocated GLP": getAmount(data.allocated),
      State: data.state,
      "Ranking Scope": data.ranking_scope,
      "Preseason Ranking": data.ranking_is_preseason?.toString(),
      "Claim Expires At": data.claimable?.expires_at ?? undefined,
      "Latest Conversion Run ID": data.latest_delta?.run_id,
      "Latest Conversion GLP": data.latest_delta?.glp_amount,
      "Latest Conversion Builder Points": data.latest_delta?.bp,
      "Latest Conversion Community Points": data.latest_delta?.cp,
    },
  }),
  total: (data: GenLayerGLPResponse) => ({ GLP: getAmount(data.total) }),
  rank: (data: GenLayerGLPResponse) => Number(data.rank ?? 0) || 0,
  supportedAddressTypes: ["evm"],
} as AdapterExport;
