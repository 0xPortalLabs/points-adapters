// deno --allow-net --allow-read=adapters adapters/etherfi.ts

// @ts-ignore emulate a browser env.
globalThis.document = {};
const { isGoodCORS } = await import("./utils/cors.ts");

import { type AdapterExport } from "./utils/adapter.ts";
import { runAdapter } from "./utils/adapter.ts";

import * as path from "@std/path";

const isValidAddress = (address: string) => /^0x[a-fA-F0-9]{40}$/.test(address);

// ref: https://stackoverflow.com/a/39466341
const nth = (n: number) => {
  return (
    n.toString() +
    (["st", "nd", "rd"][((((n + 90) % 100) - 10) % 10) - 1] || "th")
  );
};

const showErrorAndExit = (err: string) => {
  console.error(err);
  Deno.exit(1);
};

if (Deno.args.length < 2)
  showErrorAndExit(`Missing argument for adapter, provide the filename in the format:
        Deno run adapters/file.ts 0x1234...`);

console.log(`Running adapter '${Deno.args[0]}'`);
const adapter: AdapterExport = (
  await import(path.join(Deno.cwd(), Deno.args[0]))
).default;

const address = Deno.args[1];
if (!isValidAddress(address))
  showErrorAndExit(`${address} is not a valid EVM address format 0xabcdef..`);

// Monkey path `fetch()` so we can check if adapter API url is CORS friendly.
const CORSstatus: Record<string, Promise<boolean> | boolean> = {};
const _fetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  if (typeof input === "string") {
    if (!(input in CORSstatus)) {
      CORSstatus[input] = false;
      CORSstatus[input] = isGoodCORS(input);
    }

    CORSstatus[input] = await CORSstatus[input];
  }

  return _fetch(input, init);
};

Object.defineProperty(globalThis, "Deno", {
  get: function () {
    throw new Error("Adapter should not use Deno env");
  },
});

const res = await runAdapter(adapter, address);
if (Object.keys(res.data).length > 0) {
  const formattedData = Object.entries(res.data).reduce(
    (acc, [label, data]) => {
      if (typeof data === "object") {
        // typeof LabelledDetailedData.
        Object.entries(data).forEach(([k, v]) => {
          acc[k] = acc[k] || {};
          acc[k][label] = v;
        });
      } else {
        // typeof DetailedData.
        acc[label] = { data };
      }

      return acc;
    },
    {} as Record<string, Record<string, unknown>>
  );

  console.table(formattedData);
}

console.log("\nTotal Points from Adapter export:");
typeof res.total === "object"
  ? console.table(res.total)
  : console.log(res.total);

if (res.rank) console.log(`User Rank: ${nth(res.rank)}`);
if (res.claimable) console.log(`Is there an airdrop? ${res.claimable}`);

if (res.deprecated && Object.keys(res.deprecated).length > 0) {
  const labels = Object.keys(res.data);

  const invalidKeys = Object.keys(res.deprecated).filter(
    (key) => !labels.includes(key) && key != "Points"
  );
  if (invalidKeys.length > 0) {
    console.error(
      `\nInvalid deprecated keys found: ${invalidKeys.join(", ")}` +
        "\nDeprecated keys must match exported data keys or use the default key `Points`."
    );
  }

  const isValidDeprecatedDate = (ts: number) =>
    typeof ts === "number" && ts > 0 && new Date(ts * 1000) < new Date();

  const invalidDates = Object.entries(res.deprecated).filter(
    ([_, timestamp]) => !isValidDeprecatedDate(timestamp)
  );
  if (invalidDates.length > 0) {
    console.error(
      `\nInvalid deprecated dates found for keys: ${invalidDates
        .map(([key]) => key)
        .join(", ")}. Dates must be valid UNIX timestamps in the past.`
    );
  }

  console.log("\nDeprecated Points:");
  console.table(
    Object.fromEntries(
      Object.entries(res.deprecated).map(([key, timestamp]) => [
        key,
        new Date(timestamp * 1000).toUTCString(),
      ])
    )
  );
}

console.log("\nDoes the adapter work in the browser?");
console.log("Is this a good CORS URL?");
console.table(
  Object.entries(CORSstatus).map(([url, good]) => ({
    url,
    good,
  }))
);

if (Object.values(CORSstatus).some((x) => !x)) {
  console.error(`
Make sure to wrap any API URLs with 'maybeWrapCORSProxy' from '/utils/cors.ts'
so that the adapter works in the browser.

For example:
\`\`\`js
  const API_URL = await maybeWrapCORSProxy(
      "https://app.ether.fi/api/portfolio/v3/{address}"
  );
\`\`\``);
}
