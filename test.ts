// deno --allow-net --allow-read=adapters adapters/etherfi.ts

// @ts-ignore emulate a browser env.
globalThis.document = {};
const { isGoodCORS } = await import("./utils/cors.ts");
import { type AdapterExport } from "./utils/adapter.ts";
import { runAdapter } from "./utils/adapter.ts";

import * as path from "@std/path";

import { checksumAddress } from "viem";
import { isEqual } from "lodash-es";

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

const skipAddressCheck =
  Deno.args.includes("--skip-address-check") || Deno.args.includes("-sac");

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
      if (data && typeof data === "object") {
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
    {} as Record<string, Record<string, unknown>>,
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
    (key) => !labels.includes(key) && key != "Points",
  );
  if (invalidKeys.length > 0) {
    console.error(
      `\nInvalid deprecated keys found: ${invalidKeys.join(", ")}` +
        "\nDeprecated keys must match exported data keys or use the default key `Points`.",
    );
  }

  const isValidDeprecatedDate = (ts: number) =>
    typeof ts === "number" && ts > 0 && new Date(ts * 1000) < new Date();

  const invalidDates = Object.entries(res.deprecated).filter(
    ([_, timestamp]) => !isValidDeprecatedDate(timestamp),
  );
  if (invalidDates.length > 0) {
    console.error(
      `\nInvalid deprecated dates found for keys: ${invalidDates
        .map(([key]) => key)
        .join(", ")}. Dates must be valid UNIX timestamps in the past.`,
    );
  }

  console.log("\nDeprecated Points:");
  console.table(
    Object.fromEntries(
      Object.entries(res.deprecated).map(([key, timestamp]) => [
        key,
        new Date(timestamp * 1000).toUTCString(),
      ]),
    ),
  );
}

if (!skipAddressCheck) {
  const addressNoPrefix = address.substring(2);
  const addressFormats = {
    lowercase: "0x" + addressNoPrefix.toLowerCase(),
    uppercase: "0x" + addressNoPrefix.toUpperCase(),
    mixed:
      "0x" +
      addressNoPrefix
        .split("")
        .map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()))
        .join(""),
    checksum: checksumAddress(`0x${addressNoPrefix}`),
  };

  console.log("\nTesting with different address formats");

  const results = await Promise.all([
    runAdapter(adapter, addressFormats.lowercase),
    runAdapter(adapter, addressFormats.uppercase),
    runAdapter(adapter, addressFormats.mixed),
    runAdapter(adapter, addressFormats.checksum),
  ]).then(([lowercase, uppercase, mixed, checksum]) => ({
    lowercase,
    uppercase,
    mixed,
    checksum,
  }));

  const compareResults = <T>(
    comparison: string,
    o1: Record<string, T>,
    o2: Record<string, T>,
  ) => {
    const { __data, ...x } = o1;
    const { __data: _, ...y } = o2;

    const equal = isEqual(x, y);
    if (!equal) {
      console.log("\nDifferences found:");
      Object.keys({ ...x, ...y }).forEach((key) => {
        if (!isEqual(x[key], y[key])) {
          console.log(`\nField: ${key}`);
          if (
            key === "data" &&
            typeof x[key] === "object" &&
            typeof y[key] === "object"
          ) {
            const allKeys = new Set([
              ...Object.keys(x[key] || {}),
              ...Object.keys(y[key] || {}),
            ]);

            allKeys.forEach((k) => {
              const dataX = (x[key] as Record<string, unknown>)[k];
              const dataY = (y[key] as Record<string, unknown>)[k];

              if (!isEqual(dataX, dataY)) {
                console.log(`Key: ${k}`);
                console.log(`Original:`, dataX);
                console.log(`${comparison}:`, dataY);
              }
            });
          } else {
            console.log("Original:", x[key]);
            console.log(`${comparison}:`, y[key]);
          }
        }
      });
    }
    return equal;
  };

  const isLowercaseEqual = compareResults("Lowercase", res, results.lowercase);
  const isUppercaseEqual = compareResults("Uppercase", res, results.uppercase);
  const isMixedEqual = compareResults("Mixed", res, results.mixed);
  const isChecksumEqual = compareResults("Checksum", res, results.checksum);

  console.log("\nFormat comparison results:");
  console.table({
    Lowercase: {
      format: addressFormats.lowercase,
      equal: isLowercaseEqual,
    },
    Uppercase: {
      format: addressFormats.uppercase,
      equal: isUppercaseEqual,
    },
    Mixed: {
      format: addressFormats.mixed,
      equal: isMixedEqual,
    },
    Checksum: {
      format: addressFormats.checksum,
      equal: isChecksumEqual,
    },
  });

  const allEqual =
    isLowercaseEqual && isUppercaseEqual && isMixedEqual && isChecksumEqual;

  if (!allEqual) {
    console.error(
      `
Adapter returns different results for different address formats!
Make sure to normalize addresses in your adapter's fetch function.
`,
    );
  }
}

console.log("\nDoes the adapter work in the browser?");
console.log("Is this a good CORS URL?");
console.table(
  Object.entries(CORSstatus).map(([url, good]) => ({
    url,
    good,
  })),
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

// Test error handling
console.log("\nTesting adapter error handling...");

// Store original fetch
const originalFetch = globalThis.fetch;

// Monkey patch fetch to return invalid/corrupted data
globalThis.fetch = async (input, init) => {
  const response = await originalFetch(input, init);

  // Clone the response and corrupt it
  const cloned = response.clone();

  return new Response(
    JSON.stringify({
      corrupted: true,
      invalid: "data",
      random: Math.random(),
    }),
    {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    },
  );
};

let errorTestResult: {
  threwError: boolean;
  hasPoints: boolean;
  defaultedToZero: boolean;
} = {
  threwError: false,
  hasPoints: false,
  defaultedToZero: false,
};

try {
  const errorRes = await runAdapter(adapter, address);

  // Check if it returned zero/empty points
  let totalPoints = 0;
  if (typeof errorRes.total === "object") {
    for (const val of Object.values(errorRes.total)) {
      if (typeof val === "number" && isFinite(val)) {
        totalPoints += val;
      } else if (typeof val === "string") {
        const parsed = parseFloat(val);
        if (isFinite(parsed)) {
          totalPoints += parsed;
        }
      }
      // Invalid values are skipped, not treated as zero
    }
  } else if (errorRes.total != null) {
    const parsed = Number(errorRes.total);
    if (isFinite(parsed)) {
      totalPoints = parsed;
    }
  }

  errorTestResult.hasPoints = totalPoints > 0;
  errorTestResult.defaultedToZero = totalPoints === 0;
} catch (error) {
  errorTestResult.threwError = true;
}

// Restore original fetch
globalThis.fetch = originalFetch;

console.log("\nError handling test results:");
console.table(errorTestResult);

// Validate error handling based on original results
const hasOriginalPoints =
  typeof res.total === "object"
    ? Object.values(res.total).reduce(
        (sum, val) => sum + (Number(val) || 0),
        0,
      ) > 0
    : Number(res.total) > 0;

console.log(`\nOriginal user had points: ${hasOriginalPoints}`);

if (
  hasOriginalPoints &&
  errorTestResult.hasPoints &&
  !errorTestResult.threwError
) {
  console.error(`
ERROR: Adapter returned points despite corrupted API data.
The adapter should throw an error when data is invalid.
`);
} else if (
  hasOriginalPoints &&
  errorTestResult.defaultedToZero &&
  !errorTestResult.threwError
) {
  console.error(`
Adapter silently returned zero points for corrupted data.
User has ${typeof res.total === "object" ? JSON.stringify(res.total) : res.total} points normally.
The adapter should throw an error, not default to zero.

Add validation like:
\`\`\`typescript
total: (data: { caps: string }) => {
  if (!data || !data.caps) throw new Error("Invalid API response");
  return { Caps: Number(data.caps) };
}
\`\`\`
`);
} else if (hasOriginalPoints && errorTestResult.threwError) {
  console.log("PASS: Adapter throws error for corrupted data");
} else if (!hasOriginalPoints && errorTestResult.defaultedToZero) {
  console.log("PASS: User has no points, zero is acceptable");
} else if (!hasOriginalPoints && errorTestResult.threwError) {
  console.log("PASS: Adapter throws error (acceptable)");
}
