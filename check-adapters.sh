#!/bin/bash

# Wrapper script for adapter health check
# Makes it easier to run locally

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Deno is installed
if ! command -v deno &> /dev/null; then
    echo -e "${RED}Error: Deno is not installed${NC}"
    echo "Please install Deno: https://deno.land/"
    exit 1
fi

# Check if DISCORD_WEBHOOK_URL is set
if [ -z "$DISCORD_WEBHOOK_URL" ]; then
    echo -e "${YELLOW}Warning: DISCORD_WEBHOOK_URL is not set${NC}"
    echo "Set it to receive Discord notifications on failures:"
    echo "  export DISCORD_WEBHOOK_URL='https://discord.com/api/webhooks/...'"
    echo ""
fi

# Run the health check
deno run -A check-adapters.ts "$@"
