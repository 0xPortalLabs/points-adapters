#!/bin/bash

# Setup script for Adapter Health Check
# This script helps you configure the health check system

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  Adapter Health Check Setup Wizard    ║${NC}"
echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
echo ""

# Check if Deno is installed
echo -e "${BLUE}[1/4] Checking prerequisites...${NC}"
if ! command -v deno &> /dev/null; then
    echo -e "${RED}✗ Deno is not installed${NC}"
    echo ""
    echo "Please install Deno first:"
    echo "  curl -fsSL https://deno.land/install.sh | sh"
    echo ""
    echo "Or visit: https://deno.land/"
    exit 1
else
    DENO_VERSION=$(deno --version | head -n1)
    echo -e "${GREEN}✓ Deno is installed ($DENO_VERSION)${NC}"
fi

# Make scripts executable
echo -e "${BLUE}[2/4] Making scripts executable...${NC}"
chmod +x check-adapters.sh 2>/dev/null || true
chmod +x test-discord-webhook.ts 2>/dev/null || true
chmod +x examples/health-check-examples.sh 2>/dev/null || true
echo -e "${GREEN}✓ Scripts are now executable${NC}"

# Set up environment file
echo -e "${BLUE}[3/4] Setting up environment configuration...${NC}"
if [ -f .env ]; then
    echo -e "${YELLOW}! .env file already exists, skipping${NC}"
else
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file from template${NC}"
    echo -e "${YELLOW}  Edit .env to add your Discord webhook URL${NC}"
fi

# Ask about Discord webhook
echo -e "${BLUE}[4/4] Discord webhook configuration...${NC}"
echo ""
read -p "Do you want to configure Discord notifications now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${CYAN}How to get a Discord webhook URL:${NC}"
    echo "1. Open Discord and go to Server Settings → Integrations"
    echo "2. Click 'Webhooks' → 'New Webhook'"
    echo "3. Configure the webhook (name, channel, avatar)"
    echo "4. Click 'Copy Webhook URL'"
    echo ""
    
    read -p "Enter your Discord webhook URL (or press Enter to skip): " WEBHOOK_URL
    
    if [ -n "$WEBHOOK_URL" ]; then
        # Update .env file
        if grep -q "DISCORD_WEBHOOK_URL=" .env; then
            sed -i.bak "s|DISCORD_WEBHOOK_URL=.*|DISCORD_WEBHOOK_URL=$WEBHOOK_URL|" .env
            rm .env.bak 2>/dev/null || true
        else
            echo "DISCORD_WEBHOOK_URL=$WEBHOOK_URL" >> .env
        fi
        
        echo -e "${GREEN}✓ Webhook URL saved to .env${NC}"
        echo ""
        
        read -p "Do you want to test the webhook now? (y/n) " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo ""
            deno run -A test-discord-webhook.ts "$WEBHOOK_URL"
        fi
    else
        echo -e "${YELLOW}Skipped webhook configuration${NC}"
    fi
else
    echo -e "${YELLOW}Skipped webhook configuration${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║       Setup Complete! 🎉               ║${NC}"
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo ""

echo -e "${CYAN}Next steps:${NC}"
echo ""
echo "1. Test the health check with default addresses:"
echo -e "   ${YELLOW}./check-adapters.sh${NC}"
echo ""
echo "2. Test with a specific address:"
echo -e "   ${YELLOW}./check-adapters.sh 0x3c2573b002cf51e64ab6d051814648eb3a305363${NC}"
echo ""
echo "3. See all available options:"
echo -e "   ${YELLOW}./check-adapters.sh --help${NC}"
echo ""
echo "4. View usage examples:"
echo -e "   ${YELLOW}./examples/health-check-examples.sh${NC}"
echo ""
echo "5. Read the comprehensive guide:"
echo -e "   ${YELLOW}cat HEALTH_CHECK_GUIDE.md${NC}"
echo ""

echo -e "${CYAN}Documentation:${NC}"
echo "  - HEALTH_CHECK_SUMMARY.md - Quick overview"
echo "  - HEALTH_CHECK_GUIDE.md   - Comprehensive guide"
echo "  - README.md               - Project documentation"
echo ""

echo -e "${CYAN}CI/CD Setup:${NC}"
echo "  - GitHub Actions workflow: .github/workflows/adapter-health-check.yml"
echo "  - Add DISCORD_WEBHOOK_URL secret in repository settings"
echo ""

echo -e "${GREEN}Happy testing! 🚀${NC}"
