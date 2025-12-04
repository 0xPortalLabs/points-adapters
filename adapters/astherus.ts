import type { AdapterExport } from "../utils/adapter.ts";

const API_URL =
  "https://www.asterdex.com/bapi/futures/v1/public/future/ae/point";

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
      headers: {
        "content-type": "application/json",
      },
    });
    return (await res.json())?.data;
  },
  data: (data: AstherusData) => {
    const { auInfo, currentEpochRhInfo } = data;
    return {
      "Au Share": auInfo.share,
      "Au Rank": auInfo.rank,
      "Au Total": auInfo.totalAu,
      "Au Per Hour": auInfo.auPerHour,
      "Au Sources User": auInfo.auSources.user,
      "Au Sources Invitees": auInfo.auSources.invitees,
      "Au Sources Invitees of Invitees": auInfo.auSources.inviteesOfInvitees,
      "Au Team Boost": auInfo.teamBoost,
      "Au Team Total": auInfo.teamTotalAu,
      "Current Epoch Rh Id": currentEpochRhInfo.epochId,
      "Current Epoch Rh Share": currentEpochRhInfo.share,
      "Current Epoch Rh Rank": currentEpochRhInfo.rank,
      "Current Epoch Rh Total": currentEpochRhInfo.totalRh,
      "Current Epoch Rh User": currentEpochRhInfo.userCurrentEpochRh,
      "Current Epoch Rh Sources User": currentEpochRhInfo.rhSources.user,
      "Current Epoch Rh Sources Invitees":
        currentEpochRhInfo.rhSources.invitees,
      "Current Epoch Rh Sources Invitees of Invitees":
        currentEpochRhInfo.rhSources.inviteesOfInvitees,
      "Current Epoch Rh Team Boost": currentEpochRhInfo.teamBoost,
    };
  },
  total: (data: AstherusData) => data.auInfo.totalAu,
  rank: (data: AstherusData) => parseInt(String(data.currentEpochRhInfo.rank)),
} as AdapterExport;
