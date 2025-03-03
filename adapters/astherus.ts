import type { AdapterExport } from "../utils/adapter.ts";

import { convertValuesToNormal } from "../utils/object.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL =
  "https://www.astherus.finance/bapi/futures/v1/public/future/ae/point";

interface AstherusData {
  auInfo: {
    share: number;
    rank: number;
    totalAu: number;
    auPerHour: number;
    auSources: {
      user: number;
      invitees: number;
      inviteesOfInvitees: number;
    };
    teamBoost: number;
    teamTotalAu: number;
  };
  currentEpochRhInfo: {
    epochId: number;
    share: number;
    rank: number;
    totalRh: number;
    userCurrentEpochRh: number;
    rhSources: {
      user: number;
      invitees: number;
      inviteesOfInvitees: number;
    };
    teamBoost: number;
  };
}

/*
{
    name: "0xaa17...57f0",
    auInfo: {
        share: 0.00001608,
        rank: 1727,
        totalAu: 41175023,
        auPerHour: 1592824,
        auSources: { user: 41175023, invitees: 0, inviteesOfInvitees: 0 },
        teamBoost: 1.05,
        teamTotalAu: 1598866,
    },
    currentEpochRhInfo: {
        epochId: 8,
        share: 0.0,
        rank: 39367,
        totalRh: 88667964,
        userCurrentEpochRh: 0,
        rhSources: { user: 0, invitees: 0, inviteesOfInvitees: 0 },
        teamBoost: 1.0,
    },
    }
*/
export default {
  fetch: async (address: string): Promise<AstherusData> => {
    const res = await fetch(API_URL.replace("{address}", address), {
      method: "POST",
      body: JSON.stringify({ address }),
      headers: { "content-type": "application/json" },
    });
    return (await res.json())?.data;
  },
  points: (data: AstherusData) => {
    const { auInfo, currentEpochRhInfo } = data;
    return convertValuesToNormal({
      auInfo_share: auInfo.share,
      auInfo_rank: auInfo.rank,
      auInfo_totalAu: auInfo.totalAu,
      auInfo_auPerHour: auInfo.auPerHour,
      auInfo_auSources_user: auInfo.auSources.user,
      auInfo_auSources_invitees: auInfo.auSources.invitees,
      auInfo_auSources_inviteesOfInvitees: auInfo.auSources.inviteesOfInvitees,
      auInfo_teamBoost: auInfo.teamBoost,
      auInfo_teamTotalAu: auInfo.teamTotalAu,
      currentEpochRhInfo_epochId: currentEpochRhInfo.epochId,
      currentEpochRhInfo_share: currentEpochRhInfo.share,
      currentEpochRhInfo_rank: currentEpochRhInfo.rank,
      currentEpochRhInfo_totalRh: currentEpochRhInfo.totalRh,
      currentEpochRhInfo_userCurrentEpochRh:
        currentEpochRhInfo.userCurrentEpochRh,
      currentEpochRhInfo_rhSources_user: currentEpochRhInfo.rhSources.user,
      currentEpochRhInfo_rhSources_invitees:
        currentEpochRhInfo.rhSources.invitees,
      currentEpochRhInfo_rhSources_inviteesOfInvitees:
        currentEpochRhInfo.rhSources.inviteesOfInvitees,
      currentEpochRhInfo_teamBoost: currentEpochRhInfo.teamBoost,
    });
  },
  total: (data: AstherusData) => data.auInfo.totalAu,
  rank: (data: AstherusData) => parseInt(String(data.currentEpochRhInfo.rank)),
} as AdapterExport;
