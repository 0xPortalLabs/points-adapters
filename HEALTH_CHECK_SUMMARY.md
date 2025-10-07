# Adapter Health Check - Summary

This document provides a quick overview of the adapter health check system.

## 📁 Files Created

### Core Scripts

| File | Purpose | Usage |
|------|---------|-------|
| `check-adapters.ts` | Main health check script | `deno run -A check-adapters.ts [addresses] [options]` |
| `check-adapters.sh` | Bash wrapper for easier execution | `./check-adapters.sh [addresses] [options]` |
| `test-discord-webhook.ts` | Test Discord webhook configuration | `deno run -A test-discord-webhook.ts [webhook-url]` |

### Configuration Files

| File | Purpose |
|------|---------|
| `.env.example` | Template for environment variables |
| `health-check.config.example.json` | Example configuration for advanced setups |

### Documentation

| File | Purpose |
|------|---------|
| `HEALTH_CHECK_GUIDE.md` | Comprehensive guide with examples and troubleshooting |
| `HEALTH_CHECK_SUMMARY.md` | This file - quick overview |
| `examples/health-check-examples.sh` | Collection of usage examples |

### CI/CD

| File | Purpose |
|------|---------|
| `.github/workflows/adapter-health-check.yml` | GitHub Actions workflow for automated testing |

## 🚀 Quick Start

1. **Test a single adapter:**
   ```bash
   ./check-adapters.sh 0x3c2573b002cf51e64ab6d051814648eb3a305363
   ```

2. **Set up Discord notifications:**
   ```bash
   # Test webhook first
   deno run -A test-discord-webhook.ts "https://discord.com/api/webhooks/..."
   
   # Set environment variable
   export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
   
   # Run health check
   ./check-adapters.sh 0x3c2573b002cf51e64ab6d051814648eb3a305363
   ```

3. **CI/CD Setup (GitHub Actions):**
   - Go to repository Settings → Secrets and Variables → Actions
   - Add secret: `DISCORD_WEBHOOK_URL`
   - The workflow runs automatically on push/PR and daily

## ✨ Key Features

- ✅ **Automated Testing** - Test all adapters with multiple addresses
- 🔔 **Discord Notifications** - Get notified on failures via webhook
- 🚀 **CI/CD Ready** - Includes GitHub Actions workflow
- ⏱️ **Timeout Protection** - Prevents hanging tests
- 📊 **Detailed Reporting** - Shows success/failure with metrics
- 🎯 **Flexible Filtering** - Test specific adapters or exclude broken ones
- 🔍 **Verbose Mode** - Detailed output for debugging

## 🛠️ Common Commands

```bash
# Basic test
deno run -A check-adapters.ts 0x3c2573b002cf51e64ab6d051814648eb3a305363

# Verbose output
deno run -A check-adapters.ts 0x3c2573b002cf51e64ab6d051814648eb3a305363 --verbose

# Test specific adapters
deno run -A check-adapters.ts 0x3c2573b002cf51e64ab6d051814648eb3a305363 --only sonic,etherfi

# Exclude adapters
deno run -A check-adapters.ts 0x3c2573b002cf51e64ab6d051814648eb3a305363 --exclude broken-adapter

# Custom timeout
deno run -A check-adapters.ts 0x3c2573b002cf51e64ab6d051814648eb3a305363 --timeout 60000

# Multiple addresses
deno run -A check-adapters.ts 0xAddr1... 0xAddr2... 0xAddr3... --verbose
```

## 📋 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DISCORD_WEBHOOK_URL` | Discord webhook for notifications | Optional |
| `CORS_PROXY_URL` | Custom CORS proxy URL | Optional |

## 🔧 Command Line Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--verbose` | `-v` | Show detailed output | `false` |
| `--only <list>` | - | Test only specific adapters | All |
| `--exclude <list>` | - | Exclude specific adapters | None |
| `--timeout <ms>` | - | Timeout per adapter | `30000` |
| `--no-webhook` | - | Disable Discord notifications | `false` |
| `--skip-address-check` | `-sac` | Skip address validation | `false` |
| `--help` | `-h` | Show help message | - |

## 📊 Output Example

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

## 🔔 Discord Notification Format

When adapters fail, you'll receive a Discord embed containing:

- **Title**: 🔴 Adapter Health Check Failed
- **Failed adapter names** with error details
- **Summary statistics** (Passed/Failed/Skipped)
- **Timestamp** of the check

## 🔍 Troubleshooting

| Issue | Solution |
|-------|----------|
| `deno: command not found` | Install Deno: `curl -fsSL https://deno.land/install.sh \| sh` |
| Discord webhook not sending | Verify `DISCORD_WEBHOOK_URL` is set and valid |
| Adapter timeout | Increase timeout: `--timeout 60000` |
| Too many failures | Test specific adapters: `--only adapter-name` |

## 📚 Additional Resources

- **[Full Health Check Guide](HEALTH_CHECK_GUIDE.md)** - Comprehensive documentation
- **[Usage Examples](examples/health-check-examples.sh)** - Shell script with examples
- **[Main README](README.md)** - Project documentation
- **[Config Example](health-check.config.example.json)** - Advanced configuration

## 💡 Best Practices

### For Development
- Test with multiple addresses (2-3 minimum)
- Use `--verbose` flag for debugging
- Test new adapters individually before deployment

### For Production
- Set up Discord notifications
- Run on a schedule (every 6-12 hours)
- Use appropriate timeout values (30-60 seconds)
- Monitor critical adapters separately

### For CI/CD
- Use default addresses for consistency
- Enable Discord notifications
- Run on push, PR, and schedule
- Set appropriate timeout for pipeline

## 🎯 Use Cases

1. **Local Development**
   ```bash
   # Quick check before committing
   ./check-adapters.sh 0x3c2573b002cf51e64ab6d051814648eb3a305363
   ```

2. **Pre-deployment Validation**
   ```bash
   # Test all with multiple addresses
   deno run -A check-adapters.ts 0xAddr1... 0xAddr2... 0xAddr3... --verbose
   ```

3. **Production Monitoring**
   ```bash
   # Cron job: every 6 hours
   0 */6 * * * cd /path/to/repo && deno run -A check-adapters.ts
   ```

4. **Debugging Failures**
   ```bash
   # Focus on failing adapter
   deno run -A check-adapters.ts 0x123... --only failing-adapter --verbose --no-webhook
   ```

## 🚦 Exit Codes

- `0` - All tests passed ✅
- `1` - One or more tests failed ❌

These exit codes allow CI/CD pipelines to automatically fail when adapters are broken.

## 🤝 Support

- 📖 Read the [full guide](HEALTH_CHECK_GUIDE.md)
- 💬 Join the [Discord community](https://discord.gg/3z9EUxNSaj)
- 🐛 Report issues on GitHub

---

**Ready to get started?** Run `./check-adapters.sh --help` to see all available options!
