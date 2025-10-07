# Quick Start - Adapter Health Check

Get started with the adapter health check system in under 2 minutes!

## 🚀 Setup (1 minute)

### Option 1: Automated Setup (Recommended)
```bash
./setup-health-check.sh
```

### Option 2: Manual Setup
```bash
# 1. Make scripts executable
chmod +x check-adapters.sh test-discord-webhook.ts setup-health-check.sh

# 2. Configure environment (optional)
cp .env.example .env
# Edit .env with your Discord webhook URL

# 3. Test Discord webhook (optional)
deno run -A test-discord-webhook.ts "YOUR_WEBHOOK_URL"
```

## 🎯 Basic Usage (30 seconds)

### Test All Adapters
```bash
# Use default test addresses
./check-adapters.sh

# Or with your own address
./check-adapters.sh 0x3c2573b002cf51e64ab6d051814648eb3a305363
```

### With Discord Notifications
```bash
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
./check-adapters.sh 0x3c2573b002cf51e64ab6d051814648eb3a305363
```

## 🔍 Common Commands

```bash
# Verbose output (see detailed results)
./check-adapters.sh 0x3c2573b002cf51e64ab6d051814648eb3a305363 --verbose

# Test specific adapters only
./check-adapters.sh 0x3c2573b002cf51e64ab6d051814648eb3a305363 --only sonic,etherfi

# Multiple addresses
./check-adapters.sh 0xAddr1... 0xAddr2... 0xAddr3...

# Show all options
./check-adapters.sh --help
```

## 📊 Example Output

```
Starting Adapter Health Check
Testing 1 address(es) across all adapters

Found 33 adapter(s) to test

✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓✓

=== Test Results ===

✅ sonic
✅ etherfi
✅ symbiotic
...

=== Summary ===
Total Tests:   33
Passed:        33
Failed:        0
Duration:      12.34s

All adapter tests passed! 🎉
```

## 🔔 Discord Setup

### Step 1: Get Webhook URL
1. Open Discord → Server Settings → Integrations
2. Click "Webhooks" → "New Webhook"
3. Configure and copy webhook URL

### Step 2: Test Webhook
```bash
deno run -A test-discord-webhook.ts "YOUR_WEBHOOK_URL"
```

### Step 3: Set Environment Variable
```bash
export DISCORD_WEBHOOK_URL="YOUR_WEBHOOK_URL"
```

### Step 4: Run Health Check
```bash
./check-adapters.sh 0x3c2573b002cf51e64ab6d051814648eb3a305363
```

## 🚀 CI/CD Setup (GitHub Actions)

### Step 1: Add Secret
1. Go to: Repository Settings → Secrets and Variables → Actions
2. Click "New repository secret"
3. Name: `DISCORD_WEBHOOK_URL`
4. Value: Your Discord webhook URL

### Step 2: Done!
The workflow is already configured at `.github/workflows/adapter-health-check.yml`

It will automatically:
- Run on push to main/master
- Run on pull requests
- Run daily at 00:00 UTC
- Send Discord notifications on failures

## 📚 Next Steps

- **Quick Reference:** `cat HEALTH_CHECK_SUMMARY.md`
- **Full Guide:** `cat HEALTH_CHECK_GUIDE.md`
- **Examples:** `./examples/health-check-examples.sh`
- **All Options:** `./check-adapters.sh --help`

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| `deno: command not found` | Install Deno: `curl -fsSL https://deno.land/install.sh \| sh` |
| Webhook not working | Test it: `deno run -A test-discord-webhook.ts` |
| Adapter timeout | Increase: `--timeout 60000` |
| Too many failures | Focus: `--only adapter-name` |

## ✅ Quick Checklist

- [ ] Run setup wizard: `./setup-health-check.sh`
- [ ] Test Discord webhook (optional)
- [ ] Run first health check: `./check-adapters.sh`
- [ ] Review output and results
- [ ] Set up CI/CD (GitHub Actions)
- [ ] Read full guide: `HEALTH_CHECK_GUIDE.md`

---

**That's it! You're ready to monitor your adapters.** 🎉

For more details, see:
- 📖 [HEALTH_CHECK_SUMMARY.md](HEALTH_CHECK_SUMMARY.md) - Quick reference
- 📖 [HEALTH_CHECK_GUIDE.md](HEALTH_CHECK_GUIDE.md) - Comprehensive guide
- 📖 [INDEX.md](INDEX.md) - File navigation
