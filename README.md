# Points Adapters

An adapter is just a piece code that takes in an address and returns the number of points accumulated or a record of labelled points accumulated. A label can be anything such as `{pointsFromPendle: 420}`.

## Join the Discord

[![Discord Banner](https://discordapp.com/api/guilds/1335654843968262196/widget.png?style=banner2)](https://discord.gg/3z9EUxNSaj)

## Getting Started

### Requirements

- [Deno](https://deno.land/)

### Installation

1. Clone the repository:

```sh
git clone https://github.com/0xPortalLabs/points-adapters.git
```

2. Install dependencies:

```sh
deno install
```

### Testing an adapter

```sh
deno run -A test.ts adapters/sonic.ts 0x3c2573b002cf51e64ab6d051814648eb3a305363
```

### Adapter Health Check

Run health checks on all adapters with multiple test addresses. Perfect for CI/CD pipelines and monitoring.

🚀 **[Quick Start Guide](QUICKSTART.md)** | 📖 **[Full Documentation](HEALTH_CHECK_GUIDE.md)** | 📋 **[Summary](HEALTH_CHECK_SUMMARY.md)**

#### Setup Wizard

Run the setup wizard to get started quickly:

```sh
./setup-health-check.sh
```

#### Quick Start

```sh
# Test all adapters with default addresses
./check-adapters.sh

# Test with specific addresses
./check-adapters.sh 0x123... 0x456...

# With verbose output
./check-adapters.sh 0x123... --verbose

# Test only specific adapters
./check-adapters.sh 0x123... --only sonic,etherfi

# Exclude specific adapters
./check-adapters.sh 0x123... --exclude deprecated-adapter
```

#### Discord Notifications

Set up Discord webhook notifications for adapter failures:

```sh
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
./check-adapters.sh 0x123...
```

**Test your webhook first:**
```sh
deno run -A test-discord-webhook.ts
# or
deno run -A test-discord-webhook.ts "https://discord.com/api/webhooks/..."
```

#### CI/CD Integration

The repository includes a GitHub Actions workflow (`.github/workflows/adapter-health-check.yml`) that:
- Runs automatically on push to main/master
- Runs on pull requests
- Runs daily at 00:00 UTC
- Can be triggered manually with custom addresses
- Sends Discord notifications on failures (requires `DISCORD_WEBHOOK_URL` secret)

To set up Discord notifications in GitHub Actions:
1. Go to your repository Settings → Secrets and Variables → Actions
2. Add a new secret named `DISCORD_WEBHOOK_URL`
3. Paste your Discord webhook URL

#### Available Options

- `--verbose, -v` - Show detailed output for all tests
- `--only <adapters>` - Test only specific adapters (comma-separated)
- `--exclude <adapters>` - Exclude specific adapters (comma-separated)
- `--timeout <ms>` - Set timeout per adapter test (default: 30000ms)
- `--no-webhook` - Disable Discord notifications
- `--skip-address-check, -sac` - Skip address format validation
- `--help, -h` - Show help message

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
  data: (data: Record<string, number>) => ({
    "User Activity Last Detected": new Date(
      data.user_activity_last_detected
    ).toString(),
    "Sonic Points": data.sonic_points,
    "Loyalty Multiplier": data.loyalty_multiplier,
    "Ecosystem Points": data.ecosystem_points,
    "Passive Liquidity Points": data.passive_liquidity_points,
    "Activity Points": data.activity_points,
    Rank: data.rank,
  }),
  total: (data: Record<string, number>) => data.sonic_points,
  rank: (data: { rank: number }) => data.rank,
} as AdapterExport;
```

#### Breakdown

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

The first export is `fetch`. Just like the browser [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch), you provide some data and then you get some data back. This data does not need to be normalized but it is passed to all other "normalizing" method (`data`, `total`, `claimable`, etc.).

```ts
// [...]
  data: (data: Record<string, number>) => ({
    "User Activity Last Detected": new Date(
      data.user_activity_last_detected
    ).toString(),
    "Sonic Points": data.sonic_points,
    "Loyalty Multiplier": data.loyalty_multiplier,
    "Ecosystem Points": data.ecosystem_points,
    "Passive Liquidity Points": data.passive_liquidity_points,
    "Activity Points": data.activity_points,
    Rank: data.rank,
  }),
// [...]
```

The second export is `data` which returns a `Record<string, string | number>` of labelled points and data. This is displayed on "detailed" info on a protocol.

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

#### Points Terminology

_Want to use a different terminology than points?_

Take a look at the adapter for [Dolomite](dolomite.io) which uses the term "Minerals" instead of points.

```ts
export default {
  // ...
  data: ({
    milestones,
    airdrop,
  }: {
    milestones: { amount: number | null; rank: number | null };
    airdrop?: { amount: string; level_snapshot: number };
  }) => {
    return {
      Minerals: {
        Amount: milestones.amount ?? 0,
        Rank: milestones.rank ?? 0,
        Airdrop: airdrop?.amount ?? 0,
        Level: airdrop?.level_snapshot ?? 0,
      },
    };
  },
  total: ({ milestones }: { milestones: { amount?: number } }) => ({
    Minerals: milestones.amount ?? 0,
  }),
  // ...
} as AdapterExport;
```

Just simply wrap the `data` and `total` data with the label you want to use. It is case sensitive. This will be reflected on the frontend.

#### Deprecated Points

Using the example of the [dolomite adapter](./adapters/dolomite.ts), Minerals expired on Jan 10th according to their [docs](https://docs.dolomite.io/minerals). To reflect this on the adapter add an export called `deprecated`.

```ts
export default {
  // ...
  deprecated: () => ({
    Minerals: 1736467200, // Jan 10th 00:00 UTC
  });
  // ...
}
```

#### Changing CORS Proxy

To change the CORS proxy used by the adapters in local development, use the env variable `CORS_PROXY_URL`.

```sh
$ CORS_PROXY_URL="https://..." deno run ...
```

The function returns a record of `label`: `timestamp` which is in [UNIX time format](https://en.wikipedia.org/wiki/Unix_time). The labels are the same labels used in the adapter, if no labels are used by your other functions then use the label `Points`, which indicates that the points program has completely been deprecated.
