# Adapter Health Check - File Index

This document provides a complete index of all health check related files.

## 📑 Quick Navigation

- [Getting Started](#getting-started)
- [Core Scripts](#core-scripts)
- [Documentation](#documentation)
- [Configuration](#configuration)
- [CI/CD](#cicd)
- [Examples](#examples)

## Getting Started

### First Time Setup

1. **Run the setup wizard:**
   ```bash
   ./setup-health-check.sh
   ```

2. **Read the summary:**
   ```bash
   cat HEALTH_CHECK_SUMMARY.md
   ```

3. **Run your first health check:**
   ```bash
   ./check-adapters.sh 0x3c2573b002cf51e64ab6d051814648eb3a305363
   ```

## Core Scripts

### Main Health Check Script
**File:** `check-adapters.ts`
- **Purpose:** Main TypeScript health check script
- **Usage:** `deno run -A check-adapters.ts [addresses] [options]`
- **Features:** Tests all adapters, sends Discord notifications, supports filtering
- **Documentation:** See `--help` flag or HEALTH_CHECK_GUIDE.md

### Bash Wrapper
**File:** `check-adapters.sh`
- **Purpose:** Convenient bash wrapper for the main script
- **Usage:** `./check-adapters.sh [addresses] [options]`
- **Features:** Checks for Deno installation, warns about missing webhook
- **Best for:** Quick local testing

### Discord Webhook Tester
**File:** `test-discord-webhook.ts`
- **Purpose:** Test Discord webhook configuration
- **Usage:** `deno run -A test-discord-webhook.ts [webhook-url]`
- **Features:** Validates webhook URL, sends test message
- **Best for:** Verifying webhook setup before running health checks

### Setup Wizard
**File:** `setup-health-check.sh`
- **Purpose:** Interactive setup wizard
- **Usage:** `./setup-health-check.sh`
- **Features:** Checks prerequisites, sets up environment, configures webhook
- **Best for:** First-time setup

## Documentation

### Comprehensive Guide
**File:** `HEALTH_CHECK_GUIDE.md`
- **Purpose:** Complete documentation for the health check system
- **Contents:**
  - Detailed usage instructions
  - Configuration options
  - CI/CD integration guides
  - Troubleshooting section
  - Best practices
  - Advanced usage examples
- **Length:** ~500 lines
- **Best for:** Deep dive into all features

### Quick Summary
**File:** `HEALTH_CHECK_SUMMARY.md`
- **Purpose:** Quick reference and overview
- **Contents:**
  - File listing
  - Quick start commands
  - Common usage patterns
  - Troubleshooting table
- **Length:** ~200 lines
- **Best for:** Quick reference

### Feature List
**File:** `FEATURES.md`
- **Purpose:** Complete feature overview
- **Contents:**
  - Core features
  - Reporting capabilities
  - Command line options
  - Use cases
  - Best practices
- **Length:** ~350 lines
- **Best for:** Understanding what the system can do

### Main README
**File:** `README.md` (updated sections)
- **Purpose:** Project-wide documentation
- **Health Check Sections:**
  - Setup wizard link
  - Quick start guide
  - Discord notification setup
  - CI/CD integration overview
  - Available options
- **Best for:** Project overview

### This File
**File:** `INDEX.md`
- **Purpose:** Navigation and file reference
- **Contents:** You're reading it!
- **Best for:** Finding specific files and documentation

## Configuration

### Environment Template
**File:** `.env.example`
- **Purpose:** Template for environment variables
- **Contents:**
  ```bash
  DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
  CORS_PROXY_URL=https://your-cors-proxy.com
  ```
- **Usage:** Copy to `.env` and fill in your values
- **Setup:** Run `./setup-health-check.sh` for guided setup

### Configuration Example
**File:** `health-check.config.example.json`
- **Purpose:** Advanced configuration template
- **Contents:**
  - Default addresses
  - Test suite definitions
  - Notification settings
  - Scheduling configuration
- **Usage:** Reference for advanced setups
- **Best for:** Complex test scenarios

## CI/CD

### GitHub Actions Workflow
**File:** `.github/workflows/adapter-health-check.yml`
- **Purpose:** Automated CI/CD testing
- **Triggers:**
  - Push to main/master
  - Pull requests
  - Daily schedule (00:00 UTC)
  - Manual workflow dispatch
- **Setup:**
  1. Add `DISCORD_WEBHOOK_URL` secret to repository
  2. Workflow runs automatically
- **Features:**
  - Caches Deno dependencies
  - Uploads test results
  - Sends Discord notifications on failure

### Other CI/CD Examples
**Location:** `HEALTH_CHECK_GUIDE.md` (CI/CD Integration section)
- **GitLab CI:** `.gitlab-ci.yml` example
- **Jenkins:** `Jenkinsfile` example
- **CircleCI:** `.circleci/config.yml` example

## Examples

### Usage Examples Script
**File:** `examples/health-check-examples.sh`
- **Purpose:** Collection of usage examples
- **Contents:**
  - 15+ example commands
  - Different scenarios and options
  - Comments explaining each example
- **Usage:** `./examples/health-check-examples.sh` to view all examples
- **Best for:** Learning different usage patterns

## File Tree

```
.
├── check-adapters.ts              # Main health check script
├── check-adapters.sh              # Bash wrapper
├── test-discord-webhook.ts        # Webhook tester
├── setup-health-check.sh          # Setup wizard
├── .env.example                   # Environment template
├── health-check.config.example.json  # Config example
│
├── HEALTH_CHECK_GUIDE.md          # Comprehensive guide
├── HEALTH_CHECK_SUMMARY.md        # Quick summary
├── FEATURES.md                    # Feature list
├── INDEX.md                       # This file
├── README.md                      # Main README (updated)
│
├── .github/
│   └── workflows/
│       └── adapter-health-check.yml  # GitHub Actions workflow
│
└── examples/
    └── health-check-examples.sh   # Usage examples
```

## Common Tasks

### Setup & Configuration

| Task | Command | Documentation |
|------|---------|---------------|
| Initial setup | `./setup-health-check.sh` | HEALTH_CHECK_SUMMARY.md |
| Test webhook | `deno run -A test-discord-webhook.ts` | HEALTH_CHECK_GUIDE.md |
| View examples | `./examples/health-check-examples.sh` | examples/health-check-examples.sh |

### Running Health Checks

| Task | Command | Documentation |
|------|---------|---------------|
| Basic test | `./check-adapters.sh` | HEALTH_CHECK_SUMMARY.md |
| With address | `./check-adapters.sh 0x123...` | HEALTH_CHECK_GUIDE.md |
| Verbose mode | `./check-adapters.sh 0x123... --verbose` | HEALTH_CHECK_GUIDE.md |
| Specific adapters | `./check-adapters.sh 0x123... --only sonic,etherfi` | HEALTH_CHECK_GUIDE.md |
| Get help | `./check-adapters.sh --help` | Built-in help |

### CI/CD Setup

| Task | Location | Documentation |
|------|----------|---------------|
| GitHub Actions | `.github/workflows/adapter-health-check.yml` | HEALTH_CHECK_GUIDE.md |
| Add webhook secret | Repository Settings → Secrets | HEALTH_CHECK_GUIDE.md |
| GitLab CI example | HEALTH_CHECK_GUIDE.md | CI/CD Integration section |
| Jenkins example | HEALTH_CHECK_GUIDE.md | CI/CD Integration section |

### Troubleshooting

| Issue | Solution | Documentation |
|-------|----------|---------------|
| Deno not found | Install: `curl -fsSL https://deno.land/install.sh \| sh` | HEALTH_CHECK_GUIDE.md |
| Webhook not working | Run `deno run -A test-discord-webhook.ts` | HEALTH_CHECK_GUIDE.md |
| Adapter timeout | Use `--timeout 60000` | HEALTH_CHECK_GUIDE.md |
| Too many failures | Use `--only adapter-name` | HEALTH_CHECK_SUMMARY.md |

## Documentation Flow

```
Start Here
    ↓
[README.md] ──→ [setup-health-check.sh] ──→ Test your first adapter
    ↓                                              ↓
Need quick ref?                              Working? Great!
    ↓                                              ↓
[HEALTH_CHECK_SUMMARY.md]                    Want to learn more?
    ↓                                              ↓
Need details?                            [HEALTH_CHECK_GUIDE.md]
    ↓                                              ↓
[HEALTH_CHECK_GUIDE.md]                      Advanced setup?
    ↓                                              ↓
What can it do?                          [health-check.config.example.json]
    ↓                                              ↓
[FEATURES.md]                                CI/CD setup?
    ↓                                              ↓
Where is X file?                         [.github/workflows/adapter-health-check.yml]
    ↓
[INDEX.md] ← You are here
```

## Quick Reference

### Environment Variables
- `DISCORD_WEBHOOK_URL` - Discord webhook for notifications
- `CORS_PROXY_URL` - Custom CORS proxy (optional)

### Exit Codes
- `0` - All tests passed
- `1` - One or more tests failed

### File Permissions
All scripts should be executable:
```bash
chmod +x check-adapters.sh
chmod +x test-discord-webhook.ts
chmod +x setup-health-check.sh
chmod +x examples/health-check-examples.sh
```

## Getting Help

1. **Built-in help:** `./check-adapters.sh --help`
2. **Quick summary:** `cat HEALTH_CHECK_SUMMARY.md`
3. **Comprehensive guide:** `cat HEALTH_CHECK_GUIDE.md`
4. **Examples:** `./examples/health-check-examples.sh`
5. **Discord community:** [Join Discord](https://discord.gg/3z9EUxNSaj)

## Statistics

- **Total files created:** 12
- **Scripts:** 4 executable files
- **Documentation:** 5 markdown files
- **Configuration:** 2 config files
- **CI/CD:** 1 workflow file
- **Total lines of code:** ~2000+
- **Total documentation:** ~1500+ lines

---

**Last Updated:** October 7, 2025

**Quick Start:** Run `./setup-health-check.sh` to begin!
