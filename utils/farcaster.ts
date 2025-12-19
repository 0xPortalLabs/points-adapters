export async function fidFromAddress(address: `0x${string}`) {
  const response = await fetch(
    `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${address}`,
    {
      headers: {
        accept: "application/json",
        api_key: "NEYNAR_API_DOCS",
      },
    },
  );

  if (!response.ok) {
    return 0n;
  }

  const data = await response.json();

  if (
    !data[address.toLowerCase()] ||
    data[address.toLowerCase()].length === 0
  ) {
    return 0n;
  }

  return BigInt(data[address.toLowerCase()][0].fid);
}
