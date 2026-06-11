import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

import {
  concatBytes,
  encodeAbiParameters,
  formatUnits,
  getAddress,
  hexToBytes,
  keccak256,
  stringToBytes,
  toHex,
} from "viem";

const MERKL_API_URL = await maybeWrapCORSProxy("https://api.merkl.xyz/v4");
const EVENTS_API_URL = "https://ipor.dev";

const GNOSIS_CHAIN_ID = 100;
const SEASON_1_TOKEN = "0xbda8c2d003755435b2a04e7f391e70123aa4e4ec";
const SEASON_2_TOKEN = "0x9390fbe563da9805ddc8aadeeb451c74f8d392da";
const EXCLUDED_REFERRER = "0x1384Fa5187D946F9639Afaa391287E0b86B31708";
const REFERRAL_SHARE_PERCENT = 10;

const REFERRAL_PASSPHRASE =
  "oczko mu sie odlepilo panie kierowniku, temu misiu";
const REFERRAL_CHECKSUM_PASSPHRASE = "xkn5VJYlV21KCNza7pjHnNjC9hOzQFah";
const REFERRAL_CODE_LENGTH = 27;
const BASE62_ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

type PointsAmount = {
  season1: number;
  season2: number;
};

type MerklBreakdown = {
  amount: string;
  pending: string;
};

type MerklReward = {
  token: { address: string; decimals: number };
  breakdowns: MerklBreakdown[];
};

type MerklUserRewards = Array<{
  rewards: MerklReward[];
}>;

type ReferralData = {
  referrers: string[];
  total: number;
};

type FusionData = {
  direct: PointsAmount;
  referralBoost: PointsAmount;
  referrers: number;
};

const emptyPoints = (): PointsAmount => ({ season1: 0, season2: 0 });

const addPoints = (a: PointsAmount, b: PointsAmount): PointsAmount => ({
  season1: a.season1 + b.season1,
  season2: a.season2 + b.season2,
});

const totalPoints = (points: PointsAmount) => points.season1 + points.season2;

const scalePoints = (points: PointsAmount, percent: number): PointsAmount => ({
  season1: (points.season1 * percent) / 100,
  season2: (points.season2 * percent) / 100,
});

const toPoints = (amount: string, pending: string, decimals: number) =>
  parseFloat(formatUnits(BigInt(amount) + BigInt(pending), decimals));

const pointsFromRewards = (rewards: MerklUserRewards): PointsAmount => {
  const points = emptyPoints();

  for (const chainRewards of rewards) {
    for (const reward of chainRewards.rewards) {
      const tokenAddress = reward.token.address.toLowerCase();
      if (
        tokenAddress !== SEASON_1_TOKEN &&
        tokenAddress !== SEASON_2_TOKEN
      ) {
        continue;
      }

      const amount = reward.breakdowns.reduce(
        (sum, breakdown) =>
          sum +
          toPoints(breakdown.amount, breakdown.pending, reward.token.decimals),
        0,
      );

      if (tokenAddress === SEASON_1_TOKEN) points.season1 += amount;
      if (tokenAddress === SEASON_2_TOKEN) points.season2 += amount;
    }
  }

  return points;
};

const fetchUserPoints = async (address: string): Promise<PointsAmount> => {
  const url = new URL(`${MERKL_API_URL}/users/${address}/rewards`);
  url.searchParams.set("chainId", String(GNOSIS_CHAIN_ID));
  url.searchParams.set("test", "false");

  const res = await fetch(url.toString());
  if (!res.ok) return emptyPoints();

  return pointsFromRewards((await res.json()) as MerklUserRewards);
};

const hmacSha256 = async (key: Uint8Array, data: Uint8Array) => {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, data));
};

const xor10 = (a: Uint8Array, b: Uint8Array) => {
  const result = new Uint8Array(10);
  for (let i = 0; i < result.length; i++) result[i] = a[i] ^ b[i];
  return result;
};

const feistelRound = async (
  right: Uint8Array,
  key: Uint8Array,
  round: number,
) => {
  const digest = await hmacSha256(
    key,
    concatBytes([new Uint8Array([round]), right, key]),
  );
  return digest.slice(0, 10);
};

const encodeBase62 = (bytes: Uint8Array) => {
  let value = 0n;
  for (const byte of bytes) value = (value << 8n) + BigInt(byte);
  if (value === 0n) return "0".repeat(REFERRAL_CODE_LENGTH);

  let encoded = "";
  const base = BigInt(BASE62_ALPHABET.length);
  while (value > 0n) {
    encoded = BASE62_ALPHABET[Number(value % base)] + encoded;
    value /= base;
  }

  return encoded.length < REFERRAL_CODE_LENGTH
    ? "0".repeat(REFERRAL_CODE_LENGTH - encoded.length) + encoded
    : encoded.slice(-REFERRAL_CODE_LENGTH);
};

const referralChecksum = (code: string) => {
  const encoded = encodeAbiParameters(
    [{ type: "bytes32" }, { type: "bytes32" }],
    [
      toHex(stringToBytes(code, { size: 32 })),
      toHex(stringToBytes(REFERRAL_CHECKSUM_PASSPHRASE, { size: 32 })),
    ],
  );

  return keccak256(encoded).slice(-2);
};

const referralPathForAddress = async (address: string) => {
  const key = stringToBytes(REFERRAL_PASSPHRASE);
  let left = hexToBytes(address as `0x${string}`).slice(0, 10);
  let right = hexToBytes(address as `0x${string}`).slice(10, 20);

  for (let round = 0; round < 5; round++) {
    const nextRight = xor10(left, await feistelRound(right, key, round));
    left = right;
    right = nextRight;
  }

  const code = encodeBase62(concatBytes([left, right]));
  return toHex(stringToBytes(code + referralChecksum(code), { size: 32 }));
};

const fetchReferralData = async (address: string): Promise<ReferralData> => {
  const referralPath = await referralPathForAddress(address);
  const res = await fetch(`${EVENTS_API_URL}/points/${referralPath}`);
  if (!res.ok) return { referrers: [], total: 0 };

  return (await res.json()) as ReferralData;
};

export default {
  fetch: async (address: string): Promise<FusionData> => {
    const normalizedAddress = getAddress(address);
    const [direct, referralData] = await Promise.all([
      fetchUserPoints(normalizedAddress),
      fetchReferralData(normalizedAddress),
    ]);

    const referrerPoints = await Promise.all(
      referralData.referrers
        .filter(
          (referrer) =>
            referrer.toLowerCase() !== EXCLUDED_REFERRER.toLowerCase(),
        )
        .map((referrer) => fetchUserPoints(getAddress(referrer))),
    );

    const referralBoost = referrerPoints
      .map((points) => scalePoints(points, REFERRAL_SHARE_PERCENT))
      .reduce(addPoints, emptyPoints());

    return {
      direct,
      referralBoost,
      referrers: referralData.total,
    };
  },
  data: ({ direct, referralBoost, referrers }: FusionData) => {
    const total = addPoints(direct, referralBoost);

    return {
      "Fusion Points": {
        "Season 1": total.season1,
        "Season 2": total.season2,
        "Direct Season 1": direct.season1,
        "Direct Season 2": direct.season2,
        "Referral Boost Season 1": referralBoost.season1,
        "Referral Boost Season 2": referralBoost.season2,
        Referrers: referrers,
      },
    };
  },
  total: ({ direct, referralBoost }: FusionData) => ({
    "Fusion Points": totalPoints(addPoints(direct, referralBoost)),
  }),
  claimable: ({ direct, referralBoost }: FusionData) =>
    totalPoints(addPoints(direct, referralBoost)) > 0,
  supportedAddressTypes: ["evm"],
} as AdapterExport<FusionData>;
