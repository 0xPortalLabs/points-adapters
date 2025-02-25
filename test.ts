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

if (Object.keys(res.points).length > 0) {
  console.table(
    Object.entries(res.points).map(([label, points]) => ({
      label,
      points,
    }))
  );
}

console.log("\nTotal Points from Adapter export:");
if (typeof res.total === "object") {
  console.table(
    Object.entries(res.total).map(([label, points]) => ({
      label,
      points,
    }))
  );
} else {
  console.log(res.total);
}

if (res.rank) console.log(`User Rank: ${nth(res.rank)}`);
if (res.claimable) console.log(`Is there an airdrop? ${res.claimable}`);

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
