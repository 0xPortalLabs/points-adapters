// deno --allow-net --allow-read=adapters adapters/etherfi.ts
import { type AdapterExport } from "./utils/adapter.ts";
import { runAdapter } from "./utils/adapter.ts";

import * as path from "@std/path";

const isValidAddress = (address: string) =>
  address.match(/(\b0x[a-f0-9]{40}\b)/g);

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

const res = await runAdapter(adapter, address);
const pointsTotal = Object.values(res.points).reduce((x, y) => x + y, 0);

if (Object.keys(res.points).length > 1) {
  console.table(
    Object.entries(res.points).map(([label, points]) => ({
      label,
      points,
    }))
  );
}

// TODO: export claimable

console.log(`\nTotal Points from Adapter export: ${res.total}`);
console.log(`Total Points from Adapter points data: ${pointsTotal}`);

if (res.total != pointsTotal) {
  showErrorAndExit(
    `The total points deviate! fix! delta: ${pointsTotal - res.total}`
  );
}

console.log("\nsuccess!");
