#!/bin/bash

# Adapter Health Check Examples
# This file contains various examples of how to use the health check script

echo "====================================="
echo "Adapter Health Check - Usage Examples"
echo "====================================="
echo ""

# Example 1: Basic usage with default addresses
echo "Example 1: Basic usage with default addresses"
echo "$ deno run -A check-adapters.ts"
echo ""

# Example 2: Test with a single address
echo "Example 2: Test with a single address"
echo "$ deno run -A check-adapters.ts 0x3c2573b002cf51e64ab6d051814648eb3a305363"
echo ""

# Example 3: Test with multiple addresses
echo "Example 3: Test with multiple addresses"
echo "$ deno run -A check-adapters.ts 0x3c2573b002cf51e64ab6d051814648eb3a305363 0x0a66d5927ffc0ee2e38a15f16f8949e697c4f439"
echo ""

# Example 4: Verbose output
echo "Example 4: Verbose output"
echo "$ deno run -A check-adapters.ts 0x3c2573b002cf51e64ab6d051814648eb3a305363 --verbose"
echo ""

# Example 5: Test only specific adapters
echo "Example 5: Test only specific adapters"
echo "$ deno run -A check-adapters.ts 0x3c2573b002cf51e64ab6d051814648eb3a305363 --only sonic,etherfi,symbiotic"
echo ""

# Example 6: Exclude specific adapters
echo "Example 6: Exclude specific adapters"
echo "$ deno run -A check-adapters.ts 0x3c2573b002cf51e64ab6d051814648eb3a305363 --exclude deprecated-adapter"
echo ""

# Example 7: Custom timeout
echo "Example 7: Custom timeout (60 seconds)"
echo "$ deno run -A check-adapters.ts 0x3c2573b002cf51e64ab6d051814648eb3a305363 --timeout 60000"
echo ""

# Example 8: Disable Discord notifications
echo "Example 8: Disable Discord notifications"
echo "$ deno run -A check-adapters.ts 0x3c2573b002cf51e64ab6d051814648eb3a305363 --no-webhook"
echo ""

# Example 9: With Discord webhook
echo "Example 9: With Discord webhook notifications"
echo "$ export DISCORD_WEBHOOK_URL='https://discord.com/api/webhooks/...'"
echo "$ deno run -A check-adapters.ts 0x3c2573b002cf51e64ab6d051814648eb3a305363"
echo ""

# Example 10: Test Discord webhook first
echo "Example 10: Test Discord webhook first"
echo "$ deno run -A test-discord-webhook.ts"
echo ""

# Example 11: CI/CD friendly - no color output
echo "Example 11: Quick check with wrapper script"
echo "$ ./check-adapters.sh 0x3c2573b002cf51e64ab6d051814648eb3a305363"
echo ""

# Example 12: Comprehensive test
echo "Example 12: Comprehensive test with all options"
echo "$ deno run -A check-adapters.ts \\"
echo "    0x3c2573b002cf51e64ab6d051814648eb3a305363 \\"
echo "    0x0a66d5927ffc0ee2e38a15f16f8949e697c4f439 \\"
echo "    --verbose \\"
echo "    --timeout 45000"
echo ""

# Example 13: Debug a specific failing adapter
echo "Example 13: Debug a specific failing adapter"
echo "$ deno run -A check-adapters.ts 0x3c2573b002cf51e64ab6d051814648eb3a305363 --only failing-adapter --verbose --no-webhook"
echo ""

# Example 14: Production monitoring
echo "Example 14: Production monitoring (scheduled)"
echo "$ # Add to crontab:"
echo "$ 0 */6 * * * cd /path/to/repo && deno run -A check-adapters.ts >> /var/log/adapter-health.log 2>&1"
echo ""

# Example 15: Using environment file
echo "Example 15: Using environment file"
echo "$ # 1. Copy example env file"
echo "$ cp .env.example .env"
echo "$ # 2. Edit .env with your webhook URL"
echo "$ # 3. Load environment"
echo "$ source .env"
echo "$ # 4. Run health check"
echo "$ deno run -A check-adapters.ts"
echo ""

echo "====================================="
echo "For more examples, see:"
echo "  - HEALTH_CHECK_GUIDE.md"
echo "  - README.md"
echo "====================================="
