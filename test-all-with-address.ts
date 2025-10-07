#!/usr/bin/env -S deno run -A

// Test all adapters with specific address

// @ts-ignore emulate a browser env.
globalThis.document = {};

import { type AdapterExport } from "./utils/adapter.ts";
import { runAdapter } from "./utils/adapter.ts";
import * as path from "@std/path";

const TEST_ADDRESS = Deno.args[0] || "0x69155e7ca2e688ccdc247f6c4ddf374b3ae77bd6";

console.log(`Testing all adapters with address: ${TEST_ADDRESS}\n`);

// Get all adapter files
const adaptersDir = "./adapters";
const adapterFiles: string[] = [];

for await (const dirEntry of Deno.readDir(adaptersDir)) {
  if (dirEntry.isFile && dirEntry.name.endsWith(".ts")) {
    adapterFiles.push(dirEntry.name);
  }
}

interface TestResult {
  name: string;
  status: "success" | "error";
  error?: string;
  total?: number | Record<string, number>;
  hasData?: boolean;
  executionTime?: number;
}

const results: TestResult[] = [];

// Test each adapter
for (const file of adapterFiles.sort()) {
  const adapterName = file.replace(".ts", "");
  process.stdout.write(`Testing ${adapterName.padEnd(20)}... `);
  
  const startTime = Date.now();
  
  try {
    const adapter: AdapterExport = (
      await import(path.join(Deno.cwd(), adaptersDir, file))
    ).default;
    
    const res = await runAdapter(adapter, TEST_ADDRESS);
    const executionTime = Date.now() - startTime;
    
    results.push({
      name: adapterName,
      status: "success",
      total: res.total,
      hasData: Object.keys(res.data).length > 0,
      executionTime,
    });
    
    console.log(`✓ (${executionTime}ms)`);
  } catch (error) {
    const executionTime = Date.now() - startTime;
    results.push({
      name: adapterName,
      status: "error",
      error: error.message,
      executionTime,
    });
    console.log(`✗ (${executionTime}ms)`);
  }
}

// Print summary
console.log("\n" + "=".repeat(100));
console.log("DETAILED RESULTS");
console.log("=".repeat(100) + "\n");

const successful = results.filter((r) => r.status === "success");
const failed = results.filter((r) => r.status === "error");

console.log(`✓ Working: ${successful.length}/${results.length}`);
console.log(`✗ Failed: ${failed.length}/${results.length}\n`);

if (failed.length > 0) {
  console.log("Failed Adapters:");
  console.log("-".repeat(100));
  for (const result of failed) {
    console.log(`  ✗ ${result.name.padEnd(20)} ${result.error}`);
  }
  console.log();
}

if (successful.length > 0) {
  console.log("Working Adapters with Results:");
  console.log("-".repeat(100));
  for (const result of successful) {
    let totalStr: string;
    if (typeof result.total === "object") {
      totalStr = JSON.stringify(result.total);
    } else {
      totalStr = String(result.total);
    }
    
    // Truncate long output
    if (totalStr.length > 60) {
      totalStr = totalStr.substring(0, 57) + "...";
    }
    
    console.log(`  ✓ ${result.name.padEnd(20)} total=${totalStr}`);
  }
  console.log();
}

// Statistics
const avgTime = results.reduce((sum, r) => sum + (r.executionTime || 0), 0) / results.length;
console.log(`Average execution time: ${avgTime.toFixed(2)}ms`);

Deno.exit(failed.length > 0 ? 1 : 0);
