#!/usr/bin/env -S deno run --allow-net --allow-read --allow-env

// @ts-ignore emulate a browser env
globalThis.document = {};

import { type AdapterExport, runAdapter } from "./utils/adapter.ts";
import * as path from "@std/path";
import * as fs from "@std/fs";

interface Config {
  addresses: string[];
  disabledAdapters: string[];
  discordWebhookUrl?: string;
  timeout: number;
}

const loadConfig = async (): Promise<Config> => {
  try {
    const configPath = path.join(Deno.cwd(), "config.json");
    const configText = await Deno.readTextFile(configPath);
    return JSON.parse(configText);
  } catch (error) {
    console.error("Error loading config.json:", error);
    Deno.exit(1);
  }
};

const getAllAdapters = async (disabledAdapters: string[]): Promise<Record<string, string>> => {
  const adaptersDir = path.join(Deno.cwd(), "adapters");
  const adapters: Record<string, string> = {};

  for await (const entry of fs.walk(adaptersDir, { exts: [".ts"] })) {
    if (entry.isFile) {
      const adapterName = path.basename(entry.path, ".ts");
      if (!disabledAdapters.includes(adapterName)) {
        adapters[adapterName] = entry.path;
      }
    }
  }

  return adapters;
};

const testAdapter = async (
  adapterName: string,
  adapterPath: string,
  address: string,
  timeout: number
): Promise<{ adapter: string; address: string; success: boolean; error?: string }> => {
  try {
    const adapter: AdapterExport = (await import(adapterPath)).default;
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout);
    });
    
    await Promise.race([runAdapter(adapter, address), timeoutPromise]);
    
    return { adapter: adapterName, address, success: true };
  } catch (error) {
    return {
      adapter: adapterName,
      address,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

const sendDiscordWebhook = async (webhookUrl: string, failures: Array<{ adapter: string; address: string; error?: string }>) => {
  const fields = failures.slice(0, 25).map(f => ({
    name: `❌ ${f.adapter}`,
    value: `Address: \`${f.address.slice(0, 10)}...\`\nError: ${f.error?.slice(0, 100) || 'Unknown'}`,
    inline: false,
  }));

  const embed = {
    title: "🔴 Adapter Health Check Failed",
    description: `**${failures.length}** adapter test(s) failed`,
    color: 0xFF0000,
    fields,
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
  } catch (error) {
    console.error("Failed to send Discord webhook:", error);
  }
};

const main = async () => {
  const config = await loadConfig();
  const adapters = await getAllAdapters(config.disabledAdapters);
  
  console.log(`Testing ${Object.keys(adapters).length} adapters with ${config.addresses.length} address(es)\n`);

  const results = [];
  for (const [adapterName, adapterPath] of Object.entries(adapters)) {
    for (const address of config.addresses) {
      const result = await testAdapter(adapterName, adapterPath, address, config.timeout);
      results.push(result);
      process.stdout.write(result.success ? "✓" : "✗");
    }
  }
  
  console.log("\n");

  const failures = results.filter(r => !r.success);
  const passed = results.filter(r => r.success).length;

  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failures.length}`);

  if (failures.length > 0) {
    console.log("\nFailures:");
    failures.forEach(f => {
      console.log(`  ❌ ${f.adapter} (${f.address.slice(0, 10)}...): ${f.error}`);
    });

    if (config.discordWebhookUrl) {
      await sendDiscordWebhook(config.discordWebhookUrl, failures);
      console.log("\nDiscord notification sent");
    }

    Deno.exit(1);
  } else {
    console.log("\n✅ All tests passed!");
    Deno.exit(0);
  }
};

if (import.meta.main) {
  main();
}
