#!/usr/bin/env -S deno run --allow-net --allow-env

/**
 * Test Discord Webhook
 * 
 * Simple utility to test if your Discord webhook is working correctly.
 * 
 * Usage:
 *   deno run -A test-discord-webhook.ts [webhook-url]
 * 
 * If webhook-url is not provided, it will use the DISCORD_WEBHOOK_URL environment variable.
 */

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

const sendTestMessage = async (webhookUrl: string) => {
  const embed = {
    title: "✅ Discord Webhook Test",
    description: "This is a test message from the adapter health check script.",
    color: 0x00FF00, // Green
    fields: [
      {
        name: "Status",
        value: "Webhook is working correctly!",
        inline: false,
      },
      {
        name: "Test Time",
        value: new Date().toLocaleString(),
        inline: false,
      },
    ],
    footer: {
      text: "Adapter Health Check System",
    },
  };

  try {
    console.log(`${colors.cyan}Sending test message to Discord...${colors.reset}\n`);
    
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    });

    if (response.ok) {
      console.log(`${colors.green}✅ Success! Discord webhook is working correctly.${colors.reset}`);
      console.log(`${colors.green}Check your Discord channel for the test message.${colors.reset}\n`);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`${colors.red}❌ Failed to send webhook: ${response.status} ${response.statusText}${colors.reset}`);
      console.error(`${colors.red}Error details: ${errorText}${colors.reset}\n`);
      return false;
    }
  } catch (error) {
    console.error(`${colors.red}❌ Error sending webhook: ${error}${colors.reset}\n`);
    return false;
  }
};

// Main execution
const main = async () => {
  let webhookUrl = Deno.args[0];

  if (!webhookUrl) {
    webhookUrl = Deno.env.get("DISCORD_WEBHOOK_URL") || "";
  }

  if (!webhookUrl) {
    console.error(`${colors.red}Error: No webhook URL provided${colors.reset}\n`);
    console.log("Usage:");
    console.log("  deno run -A test-discord-webhook.ts [webhook-url]");
    console.log("\nOr set the DISCORD_WEBHOOK_URL environment variable:");
    console.log("  export DISCORD_WEBHOOK_URL='https://discord.com/api/webhooks/...'");
    console.log("  deno run -A test-discord-webhook.ts\n");
    
    console.log(`${colors.cyan}How to get a Discord webhook URL:${colors.reset}`);
    console.log("1. Open Discord and go to Server Settings → Integrations");
    console.log("2. Click 'Webhooks' → 'New Webhook'");
    console.log("3. Configure the webhook (name, channel, avatar)");
    console.log("4. Click 'Copy Webhook URL'\n");
    
    Deno.exit(1);
  }

  // Validate webhook URL format
  if (!webhookUrl.startsWith("https://discord.com/api/webhooks/") && 
      !webhookUrl.startsWith("https://discordapp.com/api/webhooks/")) {
    console.error(`${colors.red}Error: Invalid Discord webhook URL format${colors.reset}`);
    console.error("Webhook URL should start with: https://discord.com/api/webhooks/\n");
    Deno.exit(1);
  }

  console.log(`${colors.cyan}Discord Webhook Test Utility${colors.reset}`);
  console.log(`${colors.cyan}=============================${colors.reset}\n`);
  console.log(`Webhook URL: ${webhookUrl.substring(0, 50)}...\n`);

  const success = await sendTestMessage(webhookUrl);

  if (success) {
    console.log(`${colors.green}Next steps:${colors.reset}`);
    console.log("1. Verify the test message appeared in your Discord channel");
    console.log("2. Use this webhook URL for the health check script:");
    console.log(`   export DISCORD_WEBHOOK_URL="${webhookUrl}"`);
    console.log("3. Run the health check: ./check-adapters.sh\n");
    Deno.exit(0);
  } else {
    console.log(`${colors.yellow}Troubleshooting:${colors.reset}`);
    console.log("1. Verify the webhook URL is correct");
    console.log("2. Check if the webhook was deleted in Discord");
    console.log("3. Ensure you have internet connectivity");
    console.log("4. Create a new webhook if needed\n");
    Deno.exit(1);
  }
};

if (import.meta.main) {
  main();
}
