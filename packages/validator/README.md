# @clawmart/validator

CI auto-gates for the clawmart registry.

## Usage (CLI)

```bash
clawmart-validate --registry ./registry
```

Exits `0` if no BLOCK issues, `1` if any BLOCK issue is detected, `2` on unexpected failure.

## Severity legend

| Severity | Effect |
|---|---|
| `BLOCK` | CI must fail. Merge is prevented. |
| `WARN` | Logged for maintainer review. Does not block merge. |
| `INFO` | Advisory only. |

## Checks

- **Schema validation** — every `entry.json` parses against `@clawmart/schema`.
- **Duplicate detection** — no two entries share `(kind, name)`.
- **File existence** — every `files[].source` / `snippetFile` / `settingsPatch` exists on disk.
- **Security scan** — hook and MCP snippets are scanned for dangerous patterns (`rm -rf /`, `curl ... | sh`, ...). Warn patterns (`sudo`, credential paths, shell history) flag but do not block.

## CI integration example

```yaml
- uses: actions/checkout@v4
  with: { fetch-depth: 0 }
- uses: pnpm/action-setup@v4
- run: pnpm install
- run: pnpm --filter @clawmart/validator build
- run: node packages/validator/dist/bin.js --registry registry
```

License: MIT.
