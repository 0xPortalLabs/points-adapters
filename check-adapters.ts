#!/usr/bin/env -S deno run --allow-net --allow-read --allow-env

/**
 * Adapter Health Check Script
 * 
 * Tests all adapters with specified addresses and reports failures via Discord webhook.
 * 
 * Usage:
 *   deno run -A check-adapters.ts [addresses...] [options]
 * 
 * Environment Variables:
 *   DISCORD_WEBHOOK_URL - Discord webhook URL for failure notifications
 *   CORS_PROXY_URL - Optional CORS proxy URL
 * 
 * Options:
 *   --skip-address-check, -sac - Skip address format validation
 *   --verbose, -v - Show detailed output
 *   --only <adapter1,adapter2> - Only test specific adapters
 *   --exclude <adapter1,adapter2> - Exclude specific adapters
 *   --timeout <ms> - Timeout per adapter test (default: 30000ms)
 *   --no-webhook - Disable Discord webhook notifications
 * 
 * Examples:
 *   deno run -A check-adapters.ts 0x3c2573b002cf51e64ab6d051814648eb3a305363
 *   deno run -A check-adapters.ts 0x123... 0x456... --verbose
 *   deno run -A check-adapters.ts 0x123... --only sonic,etherfi
 */

// @ts-ignore emulate a browser env.
globalThis.document = {};

import { type AdapterExport, runAdapter } from "./utils/adapter.ts";
import * as path from "@std/path";
import * as fs from "@std/fs";

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

interface TestResult {
  adapter: string;
  address: string;
  success: boolean;
  error?: string;
  duration: number;
  data?: unknown;
}

interface AdapterStats {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
}

const isValidAddress = (address: string) => /^0x[a-fA-F0-9]{40}$/.test(address);

const parseArgs = () => {
  const args = Deno.args;
  const addresses: string[] = [];
  const options: Record<string, string | boolean> = {
    verbose: false,
    skipAddressCheck: false,
    timeout: 30000,
    noWebhook: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === "--verbose" || arg === "-v") {
      options.verbose = true;
    } else if (arg === "--skip-address-check" || arg === "-sac") {
      options.skipAddressCheck = true;
    } else if (arg === "--only") {
      options.only = args[++i];
    } else if (arg === "--exclude") {
      options.exclude = args[++i];
    } else if (arg === "--timeout") {
      options.timeout = parseInt(args[++i], 10);
    } else if (arg === "--no-webhook") {
      options.noWebhook = true;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg.startsWith("0x")) {
      addresses.push(arg);
    }
  }

  return { addresses, options };
};

const showHelp = () => {
  console.log(`
${colors.bright}Adapter Health Check Script${colors.reset}

Tests all adapters with specified addresses and reports failures via Discord webhook.

${colors.bright}Usage:${colors.reset}
  deno run -A check-adapters.ts [addresses...] [options]

${colors.bright}Environment Variables:${colors.reset}
  DISCORD_WEBHOOK_URL - Discord webhook URL for failure notifications
  CORS_PROXY_URL      - Optional CORS proxy URL

${colors.bright}Options:${colors.reset}
  --skip-address-check, -sac        Skip address format validation
  --verbose, -v                     Show detailed output
  --only <adapter1,adapter2>        Only test specific adapters
  --exclude <adapter1,adapter2>     Exclude specific adapters
  --timeout <ms>                    Timeout per adapter test (default: 30000ms)
  --no-webhook                      Disable Discord webhook notifications
  --help, -h                        Show this help message

${colors.bright}Examples:${colors.reset}
  deno run -A check-adapters.ts 0x3c2573b002cf51e64ab6d051814648eb3a305363
  deno run -A check-adapters.ts 0x123... 0x456... --verbose
  deno run -A check-adapters.ts 0x123... --only sonic,etherfi
  deno run -A check-adapters.ts 0x123... --exclude deprecated-adapter
`);
};

const getAllAdapters = async (
  onlyList?: string,
  excludeList?: string
): Promise<Record<string, string>> => {
  const adaptersDir = path.join(Deno.cwd(), "adapters");
  const adapters: Record<string, string> = {};

  const only = onlyList?.split(",").map(s => s.trim()) || [];
  const exclude = excludeList?.split(",").map(s => s.trim()) || [];

  for await (const entry of fs.walk(adaptersDir, { exts: [".ts"] })) {
    if (entry.isFile) {
      const adapterName = path.basename(entry.path, ".ts");
      
      // Apply filters
      if (only.length > 0 && !only.includes(adapterName)) continue;
      if (exclude.length > 0 && exclude.includes(adapterName)) continue;
      
      adapters[adapterName] = entry.path;
    }
  }

  return adapters;
};

const testAdapter = async (
  adapterName: string,
  adapterPath: string,
  address: string,
  timeout: number
): Promise<TestResult> => {
  const startTime = performance.now();
  
  try {
    const adapter: AdapterExport = (await import(adapterPath)).default;
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout);
    });
    
    // Race between adapter execution and timeout
    const result = await Promise.race([
      runAdapter(adapter, address),
      timeoutPromise
    ]);
    
    const duration = performance.now() - startTime;
    
    return {
      adapter: adapterName,
      address,
      success: true,
      duration,
      data: result,
    };
  } catch (error) {
    const duration = performance.now() - startTime;
    return {
      adapter: adapterName,
      address,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration,
    };
  }
};

const sendDiscordWebhook = async (
  webhookUrl: string,
  failures: TestResult[],
  stats: AdapterStats
) => {
  const failuresByAdapter = failures.reduce((acc, f) => {
    if (!acc[f.adapter]) acc[f.adapter] = [];
    acc[f.adapter].push(f);
    return acc;
  }, {} as Record<string, TestResult[]>);

  const fields = Object.entries(failuresByAdapter).slice(0, 25).map(([adapter, results]) => ({
    name: `❌ ${adapter}`,
    value: results.map(r => 
      `Address: \`${r.address.slice(0, 10)}...\`\nError: ${r.error?.slice(0, 100) || 'Unknown error'}`
    ).join('\n\n').slice(0, 1024),
    inline: false,
  }));

  const embed = {
    title: "🔴 Adapter Health Check Failed",
    description: `**${stats.failed}** of **${stats.total}** adapter tests failed`,
    color: 0xFF0000, // Red
    fields,
    timestamp: new Date().toISOString(),
    footer: {
      text: `Passed: ${stats.passed} | Failed: ${stats.failed} | Skipped: ${stats.skipped}`,
    },
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (!response.ok) {
      console.error(`${colors.red}Failed to send Discord webhook: ${response.statusText}${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}Error sending Discord webhook: ${error}${colors.reset}`);
  }
};

const printResults = (
  results: TestResult[],
  verbose: boolean
) => {
  console.log(`\n${colors.bright}${colors.cyan}=== Test Results ===${colors.reset}\n`);

  const byAdapter = results.reduce((acc, r) => {
    if (!acc[r.adapter]) acc[r.adapter] = [];
    acc[r.adapter].push(r);
    return acc;
  }, {} as Record<string, TestResult[]>);

  for (const [adapter, adapterResults] of Object.entries(byAdapter)) {
    const allPassed = adapterResults.every(r => r.success);
    const icon = allPassed ? "✅" : "❌";
    const color = allPassed ? colors.green : colors.red;
    
    console.log(`${color}${icon} ${adapter}${colors.reset}`);
    
    if (verbose || !allPassed) {
      for (const result of adapterResults) {
        const status = result.success ? `${colors.green}PASS${colors.reset}` : `${colors.red}FAIL${colors.reset}`;
        console.log(`  ${status} ${result.address} (${result.duration.toFixed(0)}ms)`);
        
        if (result.error) {
          console.log(`    ${colors.red}Error: ${result.error}${colors.reset}`);
        }
        
        if (verbose && result.success && result.data) {
          const data = result.data as { total: number | Record<string, number> };
          if (typeof data.total === 'number') {
            console.log(`    Total: ${data.total}`);
          } else if (data.total && typeof data.total === 'object') {
            console.log(`    Total: ${JSON.stringify(data.total)}`);
          }
        }
      }
    }
    console.log();
  }
};

const printSummary = (stats: AdapterStats, duration: number) => {
  console.log(`${colors.bright}${colors.cyan}=== Summary ===${colors.reset}`);
  console.log(`Total Tests:   ${stats.total}`);
  console.log(`${colors.green}Passed:        ${stats.passed}${colors.reset}`);
  console.log(`${colors.red}Failed:        ${stats.failed}${colors.reset}`);
  if (stats.skipped > 0) {
    console.log(`${colors.yellow}Skipped:       ${stats.skipped}${colors.reset}`);
  }
  console.log(`Duration:      ${(duration / 1000).toFixed(2)}s`);
  console.log();
};

// Main execution
const main = async () => {
  const { addresses, options } = parseArgs();

  if (options.help) {
    showHelp();
    Deno.exit(0);
  }

  // Default test addresses if none provided
  const testAddresses = addresses.length > 0 ? addresses : [
    "0x3c2573b002cf51e64ab6d051814648eb3a305363",
    "0x0a66d5927ffc0ee2e38a15f16f8949e697c4f439",
  ];

  // Validate addresses
  if (!options.skipAddressCheck) {
    for (const addr of testAddresses) {
      if (!isValidAddress(addr)) {
        console.error(`${colors.red}Error: Invalid address format: ${addr}${colors.reset}`);
        Deno.exit(1);
      }
    }
  }

  console.log(`${colors.bright}${colors.blue}Starting Adapter Health Check${colors.reset}`);
  console.log(`Testing ${testAddresses.length} address(es) across all adapters\n`);

  const adapters = await getAllAdapters(
    options.only as string | undefined,
    options.exclude as string | undefined
  );
  
  if (Object.keys(adapters).length === 0) {
    console.error(`${colors.red}No adapters found to test${colors.reset}`);
    Deno.exit(1);
  }

  console.log(`Found ${Object.keys(adapters).length} adapter(s) to test`);
  if (options.verbose) {
    console.log(`Adapters: ${Object.keys(adapters).join(", ")}`);
  }
  console.log();

  const startTime = performance.now();
  const results: TestResult[] = [];

  // Test all adapters with all addresses
  for (const [adapterName, adapterPath] of Object.entries(adapters)) {
    for (const address of testAddresses) {
      const result = await testAdapter(
        adapterName,
        adapterPath,
        address,
        options.timeout as number
      );
      results.push(result);

      // Show progress
      const icon = result.success ? "✓" : "✗";
      const color = result.success ? colors.green : colors.red;
      if (options.verbose) {
        console.log(`${color}${icon}${colors.reset} ${adapterName} (${address.slice(0, 10)}...) - ${result.duration.toFixed(0)}ms`);
      } else {
        process.stdout.write(`${color}${icon}${colors.reset}`);
      }
    }
  }
  
  if (!options.verbose) console.log(); // New line after progress dots

  const duration = performance.now() - startTime;

  // Calculate statistics
  const stats: AdapterStats = {
    total: results.length,
    passed: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    skipped: 0,
  };

  // Print results
  printResults(results, options.verbose as boolean);
  printSummary(stats, duration);

  // Send Discord webhook if there are failures
  const webhookUrl = Deno.env.get("DISCORD_WEBHOOK_URL");
  const failures = results.filter(r => !r.success);

  if (failures.length > 0 && webhookUrl && !options.noWebhook) {
    console.log(`${colors.yellow}Sending failure notification to Discord...${colors.reset}`);
    await sendDiscordWebhook(webhookUrl, failures, stats);
    console.log(`${colors.green}Discord notification sent${colors.reset}\n`);
  } else if (failures.length > 0 && !webhookUrl && !options.noWebhook) {
    console.log(`${colors.yellow}Note: Set DISCORD_WEBHOOK_URL environment variable to receive failure notifications${colors.reset}\n`);
  }

  // Exit with appropriate code for pipeline integration
  if (stats.failed > 0) {
    console.error(`${colors.red}${colors.bright}Health check failed with ${stats.failed} error(s)${colors.reset}`);
    Deno.exit(1);
  } else {
    console.log(`${colors.green}${colors.bright}All adapter tests passed! 🎉${colors.reset}`);
    Deno.exit(0);
  }
};

if (import.meta.main) {
  main();
}
