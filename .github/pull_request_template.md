## IMPORTANT NOTES

### Before Submitting:

- [ ] Enable "Allow edits by maintainers" on this PR
- [ ] Test your adapter locally with a valid address (EVM or SVM) and an invalid address
- [ ] If EVM-supported, ensure your adapter works with different EVM address formats (checksummed, lowercase, uppercase)
- [ ] Do NOT edit/push `package.json` or any lockfile

---

### PR Type

- [ ] **New Adapter** - Adding a new protocol adapter
- [ ] **Adapter Update** - Fixing/improving an existing adapter
- [ ] **Bug Fix** - Fixing a specific issue
- [ ] **Other** (please describe)

---

### Testing Information

**Adapter File:** `adapters/your-adapter.ts`

**Test Address (with points):**

```
0x... or SVM base58...
```

**Expected Output:**

- Total Points:
- Rank:

**How to Test Locally:**

```bash
deno run --allow-net --allow-read=adapters --allow-env test.ts adapters/your-adapter.ts <address>
```

---

## Adapter Details

**Protocol Name:**

**Defillama Slug:**
(from [Defillama protocols API](https://api.llama.fi/protocols))

**Important Features:**

- [ ] Supports multiple address formats (lowercase, uppercase, checksummed)
- [ ] If SVM-supported, works with valid Solana base58 addresses
- [ ] CORS-friendly API calls
- [ ] Fails fast on errors
- [ ] Adapter result is 100% truth

---

**Notes:** (Any additional context for this PR)
