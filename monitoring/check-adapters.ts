// deno run -A --env-file check-adapters.ts

// @ts-ignore emulate a browser env.
globalThis.document = {};

import { type AdapterExport, runAdapter } from "../utils/adapter.ts";

import * as path from "@std/path";
import * as fs from "@std/fs";

const SCRIPT_DIR = path.dirname(path.fromFileUrl(import.meta.url));

const C = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
};

interface Config {
  addresses: string[];
  disabledAdapters: string[];
  timeout_ms: number;
}

interface TestResult {
  adapter: string;
  address: string;
  success: boolean;
  error?: string;
}

const truncAddress = (address: string): string =>
  address.length > 10
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : address;

const loadConfig = async (): Promise<Config> => {
  const config = await Deno.readTextFile(path.join(SCRIPT_DIR, "config.json"));
  return JSON.parse(config);
};

const getAllAdapters = async (
  disabledAdapters: string[]
): Promise<Record<string, string>> => {
  const adaptersDir = path.join(SCRIPT_DIR, "..", "adapters");
  const adapters: Record<string, string> = {};

  for await (const entry of fs.walk(adaptersDir, { exts: [".ts"] })) {
    if (entry.isFile) {
      const name = path.basename(entry.path, ".ts");
      if (!disabledAdapters.includes(name)) adapters[name] = entry.path;
    }
  }

  return adapters;
};

const testAdapter = async (
  adapterName: string,
  adapterPath: string,
  address: string,
  timeout_ms: number
): Promise<TestResult> => {
  try {
    const adapter: AdapterExport = (await import(adapterPath)).default;
    const timeout = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Timeout after ${timeout_ms}ms`)),
        timeout_ms
      )
    );

    await Promise.race([runAdapter(adapter, address), timeout]);

    return { adapter: adapterName, address, success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : String(err),
      adapter: adapterName,
      success: false,
      address,
    };
  }
};

const sendDiscordWebhook = async (
  webhookUrl: string,
  failures: TestResult[]
) => {
  const failuresByAdapter = failures.reduce((acc, f) => {
    if (!acc[f.adapter]) acc[f.adapter] = [];
    acc[f.adapter].push({ address: f.address, error: f.error });
    return acc;
  }, {} as Record<string, Array<{ address: string; error?: string }>>);

  const fields = Object.entries(failuresByAdapter)
    .slice(0, 25)
    .map(([adapter, fails]) => ({
      name: `❌ ${adapter} (${fails.length} address${
        fails.length > 1 ? "es" : ""
      })`,
      value: fails
        .map((f) => `• \`${truncAddress(f.address)}\`: ${f.error ?? "Unknown"}`)
        .join("\n")
        .slice(0, 1024),
      inline: false,
    }));

  const embed = {
    title: "🔴 Adapter Health Check Failed",
    description:
      `**${Object.keys(failuresByAdapter).length}** ` +
      `adapter(s) failed across **${failures.length}** test(s)`,
    timestamp: new Date().toISOString(),
    color: 0xff0000,
    fields,
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] }),
  });

  if (!res.ok) {
    console.error(
      `Failed to send Discord webhook: ${res.status} ${res.statusText}`
    );
  }
};

const main = async () => {
  const config = await loadConfig();
  const adapters = await getAllAdapters(config.disabledAdapters);
  const webhookUrl = Deno.env.get("DISCORD_WEBHOOK_URL");

  if (!webhookUrl) throw new Error("DISCORD_WEBHOOK_URL is not set in env");

  const total = Object.keys(adapters).length * config.addresses.length;
  console.log(
    `Testing ${Object.keys(adapters).length} adapters with ` +
      `${config.addresses.length} address(es)\n`
  );

  const testPromises = Object.entries(adapters).flatMap(([name, adapterPath]) =>
    config.addresses.map((address) =>
      testAdapter(name, adapterPath, address, config.timeout_ms)
    )
  );

  const results = await Promise.all(testPromises);
  const failures = results.filter((r) => !r.success);
  const passed = results.length - failures.length;

  console.log(
    `\nCompleted: ${C.green}${passed} passed${C.reset}, ${C.red}${failures.length} ` +
      `failed${C.reset} out of ${C.blue}${total} tests${C.reset}\n`
  );

  if (failures.length > 0) {
    console.log(`${C.red}Failures:${C.reset}`);
    failures.forEach((f) => {
      console.log(
        `  ❌ ${C.red}${f.adapter}${C.reset} (${truncAddress(f.address)}): ` +
          `${f.error || "Unknown"}`
      );
    });

    await sendDiscordWebhook(webhookUrl, failures);
    console.log(`\n${C.green}Discord notification sent${C.reset}`);
  } else {
    console.log(`${C.green}✅ All tests passed!${C.reset}`);
  }
};

if (import.meta.main) main();
