# Adapter Health Check Guide

This guide explains how to use the adapter health check script to monitor and test all adapters.

## Overview

The `check-adapters.ts` script is designed to:
- ✅ Test all adapters automatically
- 🔍 Support multiple test addresses
- 📊 Provide detailed success/failure reporting  
- 🔔 Send Discord webhook notifications on failures
- 🚀 Integrate seamlessly with CI/CD pipelines
- ⏱️ Include timeout protection and performance metrics

## Quick Start

### Basic Usage

```bash
# Test all adapters with default addresses
deno run -A check-adapters.ts

# Test with specific addresses
deno run -A check-adapters.ts 0x3c2573b002cf51e64ab6d051814648eb3a305363

# Test multiple addresses
deno run -A check-adapters.ts 0x3c2573b002cf51e64ab6d051814648eb3a305363 0x0a66d5927ffc0ee2e38a15f16f8949e697c4f439
```

### Using the Wrapper Script

```bash
# Make script executable (first time only)
chmod +x check-adapters.sh

# Run tests
./check-adapters.sh 0x3c2573b002cf51e64ab6d051814648eb3a305363
```

## Configuration

### Environment Variables

#### DISCORD_WEBHOOK_URL (Optional)
Discord webhook URL for failure notifications.

```bash
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN"
```

**How to get a Discord webhook URL:**
1. Open Discord and go to Server Settings → Integrations
2. Click "Webhooks" → "New Webhook"
3. Configure the webhook (name, channel, avatar)
4. Click "Copy Webhook URL"

#### CORS_PROXY_URL (Optional)
Custom CORS proxy URL for adapter requests.

```bash
export CORS_PROXY_URL="https://your-cors-proxy.com"
```

## Command Line Options

### Basic Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--verbose` | `-v` | Show detailed output for all tests | `false` |
| `--help` | `-h` | Display help message | - |
| `--no-webhook` | - | Disable Discord notifications | `false` |

### Filtering Options

| Option | Description | Example |
|--------|-------------|---------|
| `--only <adapters>` | Test only specific adapters | `--only sonic,etherfi` |
| `--exclude <adapters>` | Exclude specific adapters | `--exclude broken-adapter` |

### Advanced Options

| Option | Description | Default |
|--------|-------------|---------|
| `--timeout <ms>` | Timeout per adapter test (milliseconds) | `30000` |
| `--skip-address-check` / `-sac` | Skip address format validation | `false` |

## Usage Examples

### Example 1: Test Specific Adapters

```bash
deno run -A check-adapters.ts 0x3c2573b002cf51e64ab6d051814648eb3a305363 --only sonic,etherfi,symbiotic
```

### Example 2: Exclude Broken Adapters

```bash
deno run -A check-adapters.ts 0x123... --exclude deprecated-adapter,broken-adapter
```

### Example 3: Verbose Mode with Multiple Addresses

```bash
deno run -A check-adapters.ts 0x3c2573b002cf51e64ab6d051814648eb3a305363 0x0a66d5927ffc0ee2e38a15f16f8949e697c4f439 --verbose
```

### Example 4: Quick Test with Higher Timeout

```bash
deno run -A check-adapters.ts 0x123... --timeout 60000 --verbose
```

### Example 5: CI/CD Without Discord Notifications

```bash
deno run -A check-adapters.ts 0x123... --no-webhook
```

## Output Examples

### Success Output

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

### Failure Output

```
Starting Adapter Health Check
Testing 1 address(es) across all adapters

Found 33 adapter(s) to test

✓✓✓✗✓✓✓✓✓✗✓✓✓...

=== Test Results ===

✅ sonic
❌ broken-adapter
  FAIL 0x3c2573...3363 (2145ms)
    Error: Timeout after 30000ms
...

=== Summary ===
Total Tests:   33
Passed:        31
Failed:        2
Duration:      45.67s

Sending failure notification to Discord...
Discord notification sent

Health check failed with 2 error(s)
```

## CI/CD Integration

### GitHub Actions

The repository includes `.github/workflows/adapter-health-check.yml` which:

- ✅ Runs on push to main/master branches
- ✅ Runs on pull requests
- ✅ Runs daily at 00:00 UTC (scheduled)
- ✅ Can be triggered manually with custom parameters
- ✅ Sends Discord notifications on failures

#### Setup Steps:

1. **Add Discord Webhook Secret**
   - Go to: Repository Settings → Secrets and Variables → Actions
   - Click "New repository secret"
   - Name: `DISCORD_WEBHOOK_URL`
   - Value: Your Discord webhook URL

2. **Manual Trigger**
   - Go to: Actions tab → "Adapter Health Check"
   - Click "Run workflow"
   - Enter custom addresses (optional)
   - Enable verbose mode (optional)

### GitLab CI

Example `.gitlab-ci.yml`:

```yaml
adapter-health-check:
  image: denoland/deno:latest
  script:
    - deno run -A check-adapters.ts 0x3c2573b002cf51e64ab6d051814648eb3a305363
  only:
    - main
    - merge_requests
  variables:
    DISCORD_WEBHOOK_URL: $DISCORD_WEBHOOK_URL
```

### Jenkins

Example `Jenkinsfile`:

```groovy
pipeline {
    agent any
    
    environment {
        DISCORD_WEBHOOK_URL = credentials('discord-webhook-url')
    }
    
    stages {
        stage('Health Check') {
            steps {
                sh 'deno run -A check-adapters.ts 0x3c2573b002cf51e64ab6d051814648eb3a305363'
            }
        }
    }
}
```

### CircleCI

Example `.circleci/config.yml`:

```yaml
version: 2.1

jobs:
  health-check:
    docker:
      - image: denoland/deno:latest
    steps:
      - checkout
      - run:
          name: Run Adapter Health Check
          command: deno run -A check-adapters.ts 0x3c2573b002cf51e64ab6d051814648eb3a305363
          environment:
            DISCORD_WEBHOOK_URL: $DISCORD_WEBHOOK_URL

workflows:
  version: 2
  health-check:
    jobs:
      - health-check
```

## Discord Notifications

### Notification Format

When adapters fail, a Discord embed is sent containing:

- **Title**: 🔴 Adapter Health Check Failed
- **Description**: Number of failed tests
- **Fields**: Each failed adapter with:
  - Adapter name
  - Failed address(es)
  - Error message (truncated to 100 chars)
- **Footer**: Summary statistics (Passed/Failed/Skipped)
- **Timestamp**: When the check was run

### Example Notification

```
🔴 Adapter Health Check Failed
2 of 33 adapter tests failed

❌ broken-adapter
Address: `0x3c2573b0...`
Error: Timeout after 30000ms

❌ deprecated-adapter  
Address: `0x3c2573b0...`
Error: API endpoint not found

Passed: 31 | Failed: 2 | Skipped: 0
```

## Exit Codes

The script uses standard exit codes for CI/CD integration:

- `0`: All tests passed
- `1`: One or more tests failed

This allows CI/CD pipelines to automatically fail when adapters are broken.

## Troubleshooting

### Issue: "deno: command not found"

**Solution**: Install Deno
```bash
curl -fsSL https://deno.land/install.sh | sh
```

### Issue: Discord webhook not sending

**Possible causes:**
1. `DISCORD_WEBHOOK_URL` not set
2. Invalid webhook URL
3. Network connectivity issues
4. `--no-webhook` flag is used

**Solution**: 
```bash
# Verify webhook URL is set
echo $DISCORD_WEBHOOK_URL

# Test manually
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
deno run -A check-adapters.ts 0x123...
```

### Issue: Adapter timeout

**Solution**: Increase timeout
```bash
deno run -A check-adapters.ts 0x123... --timeout 60000
```

### Issue: Too many failures

**Solution**: Test specific adapters
```bash
# Test one at a time
deno run -A check-adapters.ts 0x123... --only sonic

# Exclude known broken ones
deno run -A check-adapters.ts 0x123... --exclude broken1,broken2
```

## Best Practices

### For Local Development

1. **Test with multiple addresses**: Use at least 2-3 different addresses to catch edge cases
2. **Use verbose mode**: `--verbose` helps debug issues
3. **Set up Discord webhook**: Get immediate notifications when things break

```bash
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
./check-adapters.sh 0xAddr1... 0xAddr2... 0xAddr3... --verbose
```

### For CI/CD Pipelines

1. **Use default addresses**: Let the script use its default test addresses
2. **Run on schedule**: Daily checks catch API changes early
3. **Set appropriate timeout**: Balance between coverage and speed
4. **Enable Discord notifications**: Keep the team informed

```bash
# In CI/CD
deno run -A check-adapters.ts --timeout 45000
```

### For Monitoring

1. **Run regularly**: Schedule checks every 6-12 hours
2. **Monitor specific adapters**: Use `--only` for critical adapters
3. **Track trends**: Save results to identify recurring issues

```bash
# Cron job example (every 6 hours)
0 */6 * * * cd /path/to/repo && deno run -A check-adapters.ts >> health-check.log 2>&1
```

## Advanced Usage

### Testing New Adapters

Before deploying a new adapter:

```bash
# Test only the new adapter
deno run -A check-adapters.ts 0xTestAddr... --only new-adapter --verbose
```

### Debugging Failures

```bash
# Verbose output with single address
deno run -A check-adapters.ts 0x123... --only failing-adapter --verbose --no-webhook
```

### Performance Testing

```bash
# Test with tight timeout to find slow adapters
deno run -A check-adapters.ts 0x123... --timeout 5000 --verbose
```

### Custom Test Suites

Create custom test scripts:

```bash
# test-critical.sh
#!/bin/bash
deno run -A check-adapters.ts 0xAddr1... 0xAddr2... --only sonic,etherfi,symbiotic --timeout 60000

# test-all.sh
#!/bin/bash
deno run -A check-adapters.ts 0xAddr1... 0xAddr2... 0xAddr3... --verbose
```

## Support

For issues or questions:
1. Check the [troubleshooting section](#troubleshooting)
2. Review the [examples](#usage-examples)
3. Join the [Discord community](https://discord.gg/3z9EUxNSaj)
4. Open an issue on GitHub
