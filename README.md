# Points Adapters

An adapter is just a piece code that takes in an address and returns the number of points accumulated or a record of labelled points accumulated. A label can be anything such as `{pointsFromPendle: 420}`.

## Join the Discord

[![Discord Banner](https://discordapp.com/api/guilds/1335654843968262196/widget.png?style=banner2)](https://discord.gg/3z9EUxNSaj)

## Getting Started

### Requirements

- [Deno](https://deno.land/)
- Discord bot token from [Discord Developer Portal](https://discord.com/developers/applications)

### Installation

1. Clone the repository:

```sh
git clone https://github.com/blazewashere/points-adapters.git
```

2. Install dependencies:

```sh
deno install
```

### Testing an adapter

```sh
deno run -A test.ts adapters/sonic.ts 0x3c2573b002cf51e64ab6d051814648eb3a305363
```

### Basic Example

An example adapter for [Sonic](https://soniclabs.com) which gives us `total` points and a more detailed `points`.

```ts
import type { AdapterExport } from "../utils/adapter.ts";
import { maybeWrapCORSProxy } from "../utils/cors.ts";

const API_URL = await maybeWrapCORSProxy(
  "https://www.data-openblocklabs.com/sonic/user-points-stats?wallet_address={address}"
);

export default {
  fetch: async (address: string) => {
    return await (await fetch(API_URL.replace("{address}", address))).json();
  },
  points: (data: Record<string, number>) => ({
    sonic_points: data.sonic_points,
    loyalty_multiplier: data.loyalty_multiplier,
    ecosystem_points: data.ecosystem_points,
    passive_liquidity_points: data.passive_liquidity_points,
    activity_points: data.activity_points,
    rank: data.rank,
  }),
  total: (data: Record<string, number>) => data.sonic_points,
  rank: (data: { rank: number }) => data.rank,
} as AdapterExport;
```

##### Breakdown

```ts
const API_URL = await maybeWrapCORSProxy(
  "https://www.data-openblocklabs.com/sonic/user-points-stats?wallet_address={address}"
);
```

All adapters should target the browser and this includes using [Browser APIs](https://developer.mozilla.org/en-US/docs/Web/API) and [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS). The function `maybeWrapCORSProxy` will deal with the latter issue for all remote APIs.

```ts
// [...]
  fetch: async (address: string) => {
    return await (await fetch(API_URL.replace("{address}", address))).json();
  },
// [...]
```

The first export is `fetch`. Just like the browser [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch), you provide some data and then you get some data back. This data does not need to be normalized but it is passed to all other "normalizing" method (`points`, `total`, `claimable`, etc.).

```ts
// [...]
  points: (data: Record<string, number>) => ({
    sonic_points: data.sonic_points,
    loyalty_multiplier: data.loyalty_multiplier,
    ecosystem_points: data.ecosystem_points,
    passive_liquidity_points: data.passive_liquidity_points,
    activity_points: data.activity_points,
    rank: data.rank,
  }),
// [...]
```

The second export is `points` which returns a `Record<string, string | number>` of labelled points and data. This is displayed on "detailed" info on a protocol.

```ts
// [...]
  total: (data: Record<string, number>) => data.sonic_points,
// [...]
```

The third export is `total` which gives us the aggregate points for a wallet. This can also be a `Record<string, number>` to give aggregate season points as done in the [ether.fi adapter](./adapters/etherfi.ts). This is displayed on "total" info on a protocol.

```ts
  rank: (data: { rank: number }) => data.rank,
```

The fourth export is `rank` which gives the user rank for the protocol's points program. This is displayed on the "leaderboard" info on a protocol.
