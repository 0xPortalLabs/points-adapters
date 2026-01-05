## IMPORTANT NOTES

### Before Submitting:

- [ ] Enable "Allow edits by maintainers" on this PR
- [ ] Test your adapter locally with a valid address and an invalid address
- [ ] Ensure your adapter works with different address formats (checksummed, lowercase, uppercase)
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
0x...
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
- [ ] CORS-friendly API calls
- [ ] Fails fast on errors
- [ ] Adapter result is 100% truth

---

**Notes:**
(Any additional context for this PR)
