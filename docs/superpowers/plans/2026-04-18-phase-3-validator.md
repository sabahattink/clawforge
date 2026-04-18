# Phase 3: `@clawmart/validator` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Ship `@clawmart/validator` — a library + CLI used by CI on PRs that touch `registry/**`. Auto-gates: schema validation, duplicate detection, file existence, security scan. Link-check is optional (flag-gated) to keep CI fast and deterministic.

**Architecture:** Pure-function checkers, each returning a list of `ValidationIssue`. A driver composes them and aggregates. CLI prints issues and exits non-zero on BLOCK.

**Spec reference:** §7.2 (auto-gates), §7.3 (security scan rules).

---

## File structure

```
packages/validator/
├── package.json
├── tsconfig.json
├── tsconfig.test.json
├── vitest.config.ts
├── tsup.config.ts
├── src/
│   ├── index.ts              # public API
│   ├── bin.ts                # CLI
│   ├── issue.ts              # ValidationIssue + severity
│   ├── checks/
│   │   ├── schema.ts         # parses each entry via @clawmart/schema
│   │   ├── duplicates.ts     # cross-entry name collisions
│   │   ├── file-existence.ts # entry files[].source must exist on disk
│   │   └── security.ts       # hook/mcp snippet danger patterns
│   └── run.ts                # composes checks, returns report
└── tests/...
```

**Types:**

```ts
export type Severity = "BLOCK" | "WARN" | "INFO";
export type ValidationIssue = {
  code: string;
  severity: Severity;
  message: string;
  path?: string;
  id?: string;
};
export type ValidationReport = {
  issues: ValidationIssue[];
  blockingCount: number;
  warningCount: number;
};
```

---

## Tasks

### Task 1: Scaffold package

Files: `packages/validator/package.json`, `tsconfig.json`, `tsconfig.test.json`, `vitest.config.ts`, `tsup.config.ts`, `src/index.ts` (placeholder).

Follows the same shape as `@clawmart/build-index`. Key differences:
- `name`: `@clawmart/validator`
- `bin`: `clawmart-validate`
- Deps: `@clawmart/schema` (workspace), `@clawmart/build-index` (workspace — reuse `enumerateEntries` + `readJson`)
- DevDeps: same Vitest/tsup/typescript

**Commit:** `chore(validator): scaffold @clawmart/validator package`

---

### Task 2: `ValidationIssue` + `ValidationReport` types

TDD-first. Test that `ValidationReport.blockingCount` counts BLOCK severities, `warningCount` counts WARN.

Implementation in `src/issue.ts`.

**Commit:** `feat(validator): add ValidationIssue types`

---

### Task 3: Schema check

`checkSchema(entries: LoadedEntry[])` → `ValidationIssue[]`

For each loaded entry, run `parseEntry(raw)`; if it throws, push a BLOCK issue with `ENTRY_INVALID` code and the formatted error.

Test with one valid + one invalid fixture. Expect one BLOCK issue.

**Commit:** `feat(validator): add schema check`

---

### Task 4: Duplicate check

`checkDuplicates(entries: LoadedEntry[])` → `ValidationIssue[]`

Flag any two entries that share `(kind, name)`. BLOCK severity.

Test: two entries with same id → one BLOCK issue.

**Commit:** `feat(validator): add duplicate detection`

---

### Task 5: File existence check

`checkFileExistence(entries: LoadedEntry[], registryRoot: string)` → `ValidationIssue[]`

For each file-based entry, verify every `files[].source` exists under `<registryRoot>/<kind-dir>/<slug>/`. For merge-based entries, verify `snippetFile` exists. BLOCK on missing.

Test with a fixture missing `skill.md` → one BLOCK issue.

**Commit:** `feat(validator): add file existence check`

---

### Task 6: Security scan

`checkSecurity(entries: LoadedEntry[], registryRoot: string)` → `ValidationIssue[]`

For hook and mcp snippet files: read content, run against pattern lists. BLOCK patterns vs WARN patterns per spec §7.3.

**BLOCK regex set:**
- `rm -rf (/|\$HOME|~)(\s|$)`
- `curl .* \| (sh|bash|zsh|fish)`
- `wget .* \| (sh|bash|zsh|fish)`
- `eval\s+"\$\(curl`
- `dd if=/dev/zero`
- `> /dev/sda`
- `chmod 777`

**WARN regex set:**
- `sudo\s`
- `\~/\.ssh/`
- `\~/\.aws/`
- `\.env`
- `history`

Test fixtures:
- `hook.json` containing `"rm -rf /"` → BLOCK
- `hook.json` containing `"sudo apt"` → WARN
- Safe hook → no issues

**Commit:** `feat(validator): add security scan with BLOCK + WARN patterns`

---

### Task 7: Load + run orchestrator

`runValidator({ registryRoot })` → `Promise<ValidationReport>`

Reuse `enumerateEntries` + `readJson` from `@clawmart/build-index` to load raw JSON payloads. Build a `LoadedEntry` list: `{ location, raw, parsed?: Entry }`. Run each check and aggregate.

Test with a fixture registry that has 2 valid entries + 1 duplicate-id + 1 dangerous hook → expect at least 2 BLOCK issues.

**Commit:** `feat(validator): add run orchestrator`

---

### Task 8: CLI + public API

`src/bin.ts`:
```
clawmart-validate --registry ./registry
```
Prints each issue with code + severity + path, exits 1 if any BLOCK, 0 otherwise.

`src/index.ts`: exports `runValidator`, `ValidationIssue`, `ValidationReport`, `Severity`, individual `check*` functions.

**Commit:** `feat(validator): add CLI entry point and public API`

---

### Task 9: README + sign-off

- `packages/validator/README.md` — usage snippet, severity legend, CI integration example
- Verify: `pnpm lint && pnpm --filter @clawmart/validator typecheck && pnpm --filter @clawmart/validator test && pnpm --filter @clawmart/validator build`
- Update spec §11 with Phase 3 status
- Tag `phase-3-validator-complete`
- Merge to master

**Commits:** `docs(validator): add README` + `docs(spec): mark phase 3 complete`

---

## Exit criteria

- All four checkers working end-to-end against fixture registry.
- BLOCK patterns genuinely block (non-zero exit from CLI).
- Coverage thresholds met (lines ≥ 90, funcs ≥ 95, branches ≥ 80; `bin.ts` excluded).
- Biome clean.
- Tag `phase-3-validator-complete` on the last commit.
