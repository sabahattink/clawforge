# clawforge — Design Specification

**Date:** 2026-04-18
**Status:** Draft (approved by owner, pending spec review)
**Owner:** @kalkan
**Repo location:** `H:/60_OSS/clawforge/`

---

## 1. Overview

`clawforge` is an open-source registry and CLI for the Claude Code ecosystem — skills, agents, hooks, MCP servers, slash commands, and settings presets — installable with one command, shadcn/ui-style.

**Tagline:** *The registry for Claude Code. Install skills, agents, hooks, and MCP servers with one command.*

**Problem solved:** Claude Code ecosystem is fragmented. Skills live in scattered GitHub repos, agents in private configs, MCP configs in ad-hoc gists. There is no canonical index, no install tool, no quality signal. `clawforge` is the npm/shadcn-ui of Claude Code assets.

**Non-goals (MVP):**
- Not a skill/agent authoring tool
- Not a Claude Code runtime replacement
- Not a paid service — fully open source and self-hostable
- Not a dependency manager with semver resolution (v2)
- Not a binary package manager for MCP server code itself — only configs/manifests

---

## 2. Architecture

### 2.1 High-level data flow

```
        ┌──────────────────────────────────────────┐
        │   GitHub: github.com/<user>/clawforge     │
        │   (monorepo, source of truth)            │
        │                                          │
        │   /registry   → MD + JSON entries        │
        │   /apps/cli   → TS CLI package           │
        │   /apps/web   → Astro site               │
        │   /packages/schema → shared TS types     │
        └───────┬───────────────────┬──────────────┘
                │ CI on merge       │
                ▼                   ▼
   ┌─────────────────────┐  ┌──────────────────────┐
   │ Cloudflare R2 + KV  │  │ MeiliSearch Cloud    │
   │ registry.json       │  │ (full-text index)    │
   │ entry MD files      │  │                      │
   │ globally cached     │  │                      │
   └──────┬──────────┬───┘  └──────────┬───────────┘
          │          │                 │
     ┌────▼────┐   ┌─▼──────────────┐  │
     │ npx CLI │   │ Astro Site     │◄─┘
     │         │   │ clawforge.dev   │
     └─────────┘   └────────────────┘
```

### 2.2 Principles

- **GitHub is source of truth.** Everything else is derivative and reproducible from the repo state.
- **Zero-server runtime.** No database, no dynamic backend. CDN serves static JSON; MeiliSearch serves search. Both have free tiers.
- **User owns the code (shadcn/ui model).** Installed files live in the user's `.claude/` tree; clawforge does not hide them behind a resolver.
- **Install operations are reversible.** Manifest records exact file list + JSON merge before-state so `remove` fully cleans up.
- **Install operations are transparent.** Every write is shown to the user before it happens (unless `--yes`).
- **Content integrity via sha256.** CDN-served artifacts are verified against expected hashes at install time.

### 2.3 Tech stack

| Layer | Choice |
|---|---|
| Monorepo | Turborepo 2 + pnpm 9 |
| Language | TypeScript 5.9, `strict` + `noUncheckedIndexedAccess` |
| CLI runtime | Node.js 20+ |
| CLI deps | commander 12, prompts, chalk, ora |
| CLI bundle | tsup (single ESM bundle) |
| Schema | Zod 3 |
| Web | Astro 5 + MDX, shadcn/ui, Tailwind 4 |
| Search | MeiliSearch Cloud (free tier) |
| Search UI | MeiliSearch InstantSearch (Pagefind fallback) |
| CDN | Cloudflare R2 + Workers |
| Web hosting | Cloudflare Pages |
| Validator (CI) | Zod + `link-check` + custom security scanner |
| Test (TS) | Vitest |
| Test (web E2E) | Playwright |
| Lint/Format | Biome |
| Analytics | Plausible (privacy-friendly) |

---

## 3. Repo structure

```
clawforge/
├── apps/
│   ├── cli/                    # @clawforge/cli — npx clawforge
│   │   ├── src/
│   │   │   ├── commands/       # add, list, update, remove, search, init, info, doctor, browse
│   │   │   ├── installers/     # per-kind handlers
│   │   │   ├── registry/       # CDN fetch + local cache
│   │   │   └── manifest/       # .clawforge/manifest.json I/O
│   │   ├── package.json        # bin: { clawforge: dist/cli.js }
│   │   └── tsup.config.ts
│   │
│   └── web/                    # @clawforge/web — clawforge.dev
│       ├── src/
│       │   ├── pages/
│       │   ├── components/
│       │   └── lib/
│       └── astro.config.mjs
│
├── packages/
│   ├── schema/                 # @clawforge/schema — shared types + Zod
│   │   └── src/
│   │       ├── entry.ts
│   │       └── registry.ts
│   │
│   └── validator/              # @clawforge/validator — CI auto-gates
│       └── src/
│           ├── schema-check.ts
│           ├── link-liveness.ts
│           ├── duplicate-detect.ts
│           └── security-scan.ts
│
├── registry/                   # source of truth entries
│   ├── skills/<slug>/
│   │   ├── entry.json
│   │   ├── skill.md
│   │   └── README.md
│   ├── agents/<slug>/
│   │   ├── entry.json
│   │   └── agent.md
│   ├── hooks/<slug>/
│   │   ├── entry.json
│   │   └── hook.json
│   ├── mcp-servers/<slug>/
│   │   ├── entry.json
│   │   └── mcp.json
│   ├── commands/<slug>/
│   │   ├── entry.json
│   │   └── command.md
│   ├── presets/<slug>/
│   │   ├── entry.json
│   │   └── preset.json
│   ├── _verified.json          # maintainer-controlled
│   └── _removed.json           # tombstones for removed entries
│
├── scripts/
│   └── build-index.ts          # registry → dist/registry.json + per-kind indexes
│
├── .github/
│   ├── CODEOWNERS
│   └── workflows/
│       ├── validate-pr.yml
│       ├── publish-registry.yml
│       ├── release-cli.yml
│       ├── release-web.yml
│       └── weekly-health.yml
│
├── docs/superpowers/
│   ├── specs/                  # this file
│   └── plans/                  # implementation plans
│
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── biome.json
├── README.md                   # awesome-list formatted for GitHub SEO
├── CONTRIBUTING.md
├── SECURITY.md
├── CODE_OF_CONDUCT.md
└── LICENSE                     # MIT
```

---

## 4. Registry schema

### 4.1 Namespacing

Format: `<kind>:<slug>` or `<kind>:<user>/<slug>` (scoped).

**Kinds:** `skill`, `agent`, `hook`, `mcp`, `cmd`, `preset`.

**Global namespace** (`skill:foo`): first-come-first-served; squatting prevented by maintainer review for verification; reclaimable after 12 months of author inactivity.

**Scoped namespace** (`skill:@user/foo`): isolated per author; auto-gated — PR author must match `@user`.

### 4.2 Shared `BaseEntry` schema

```ts
interface BaseEntry {
  name: string;                    // slug, unique within kind (lowercase, kebab-case)
  kind: Kind;                      // "skill" | "agent" | "hook" | "mcp" | "cmd" | "preset"
  displayName: string;             // human name
  description: string;             // single line, ≤ 160 chars
  author: {
    name: string;
    github: string;                // @handle (must match PR author for new entries)
    url?: string;
  };
  tags: string[];                  // ≤ 5 entries, kebab-case
  category: string;                // single primary category
  version: string;                 // semver
  license: string;                 // SPDX identifier
  claudeCodeVersion?: string;      // compat hint, e.g. ">=2.0.0"
  requires?: string[];             // other clawforge entry IDs
  conflicts?: string[];            // known incompatibilities
  repository?: { type: "git"; url: string };

  // CI-populated (not author-controlled)
  verified: boolean;               // set from _verified.json
  createdAt: string;               // first commit touching entry
  updatedAt: string;               // latest commit touching entry
  sourceCommit: string;            // git SHA of the version
  sourcePR?: string;               // merged PR URL
  sha256: string;                  // content hash
}
```

### 4.3 Kind-specific schemas

**File-based entries (skill, agent, cmd):**

```ts
interface FileBasedEntry extends BaseEntry {
  files: Array<{
    source: string;                // path within entry dir
    target: string;                // "{{CLAUDE_DIR}}/skills/{{name}}/SKILL.md"
  }>;
}

interface SkillEntry extends FileBasedEntry {
  kind: "skill";
  activatesOn?: string[];          // trigger keyword hints
}

interface AgentEntry extends FileBasedEntry {
  kind: "agent";
  tools?: string[];                // ["Read", "Edit", "Bash", ...]
  model?: "sonnet" | "opus" | "haiku";
}

interface CommandEntry extends FileBasedEntry {
  kind: "cmd";
  invocation: string;              // "/code-review"
}
```

**Merge-based entries (hook, mcp):**

```ts
interface HookEntry extends BaseEntry {
  kind: "hook";
  snippetFile: string;             // relative path to hook.json
  mergeTarget: "settings.json";
  mergePath: string;               // JSONPath, e.g. "hooks.PostToolUse"
  strategy: "append" | "replace";
}

interface McpEntry extends BaseEntry {
  kind: "mcp";
  snippetFile: string;             // relative path to mcp.json
  mergeTarget: "settings.json";
  mergePath: string;               // e.g. "mcpServers.{{name}}"
  envVars?: Array<{
    name: string;
    required: boolean;
    description: string;
  }>;
}
```

**Bundle:**

```ts
interface PresetEntry extends BaseEntry {
  kind: "preset";
  includes: string[];              // ["skill:tdd-workflow", "agent:code-reviewer"]
  settingsPatch?: string;          // optional extra settings.json snippet
}
```

### 4.4 Path templating

| Token | Expansion |
|---|---|
| `{{CLAUDE_DIR}}` | `--scope global` → `~/.claude`; `--scope project` → `./.claude` |
| `{{name}}` | entry slug |

Only these two tokens are supported in v1. Any other `{{…}}` pattern in `files[].target` is a validation error. Additional tokens (e.g. `{{home}}`, `{{cwd}}`) are deferred.

**Default scopes:**
- `skill`, `agent` → `global`
- `cmd`, `preset` → `project`
- `hook`, `mcp` → explicit via `--scope`

### 4.5 Registry index (CDN artifact)

Served at `https://cdn.clawforge.dev/registry.json`:

```json
{
  "version": 1,
  "generatedAt": "2026-04-18T12:00:00Z",
  "count": 142,
  "entries": [
    {
      "id": "skill:tdd-workflow",
      "kind": "skill",
      "name": "tdd-workflow",
      "displayName": "TDD Workflow",
      "description": "…",
      "tags": ["testing", "tdd"],
      "category": "testing",
      "verified": true,
      "version": "1.2.0",
      "author": "kalkan",
      "detailUrl": "https://cdn.clawforge.dev/skills/tdd-workflow/entry.json",
      "sha256": "…",
      "updatedAt": "2026-04-10T…"
    }
  ]
}
```

Per-kind shards: `skills.json`, `agents.json`, `hooks.json`, `mcp.json`, `commands.json`, `presets.json`.

Index may reach 10 MB before pagination is needed (v2).

### 4.6 Conflict resolution at install

| Situation | Behaviour |
|---|---|
| Target file missing | Copy, done |
| Target file identical content | Skip with "already installed" |
| Target file differs | Prompt: overwrite / skip / view diff / backup-and-install |
| JSON merge — path missing | Add |
| JSON merge — path exists, `append` | Push to array |
| JSON merge — path exists, `replace` | Prompt: overwrite / keep / view diff |
| `--force` flag | Auto-overwrite |
| `--dry-run` flag | Report, do not write |

---

## 5. CLI

### 5.1 Commands

| Command | Purpose |
|---|---|
| `clawforge init` | Interactive setup — scope, manifest, optional scan of existing assets |
| `clawforge add <id>` | Install an entry |
| `clawforge search <query>` | Fuzzy search via MeiliSearch |
| `clawforge list` | Show installed entries from manifest |
| `clawforge info <id>` | Show entry details without installing |
| `clawforge update [id]` | Update tracked entries; all if `[id]` omitted |
| `clawforge remove <id>` | Uninstall — reverse file copies and JSON merges |
| `clawforge browse` | Open web UI in default browser |
| `clawforge doctor` | Health check manifest ↔ disk ↔ registry |
| `clawforge publish` | (v2) Helper for submitting a local entry as a PR |

### 5.2 Global flags

| Flag | Meaning |
|---|---|
| `--scope <global\|project>` | Target install scope |
| `--track` | Record in manifest (required for `update` to work later) |
| `--force`, `-f` | Auto-overwrite prompts |
| `--dry-run` | Print plan, do nothing |
| `--yes`, `-y` | Non-interactive confirmation |
| `--json` | Machine-readable output |
| `--registry <url>` | Alternate registry (self-hosted) |
| `--verbose`, `-v` | Debug logging |
| `--no-color` | Strip ANSI |

### 5.3 UX principles

1. No magic — show every path, every JSON diff before writing.
2. Always reversible — `remove` fully restores prior state.
3. Interactive by default, scriptable on demand (`-y`).
4. Helpful errors — "did you mean X?" suggestions for misspellings.
5. Offline-friendly — 24 h CDN cache, bypassable with `--no-cache`.
6. Progress only when it matters — no artificial spinners for fast ops.

### 5.4 Manifest format

`<scope-root>/.clawforge/manifest.json`:

```json
{
  "version": 1,
  "scope": "global",
  "claudeDir": "/home/user/.claude",
  "installed": [
    {
      "id": "skill:tdd-workflow",
      "version": "1.2.0",
      "installedAt": "2026-04-18T12:00:00Z",
      "source": "https://cdn.clawforge.dev/skills/tdd-workflow/entry.json",
      "sourceCommit": "a1b2c3…",
      "verifiedAtInstall": true,
      "files": ["skills/tdd-workflow/SKILL.md"],
      "jsonMerges": [],
      "sha256": "abc123…"
    },
    {
      "id": "mcp:github-mcp",
      "version": "0.3.1",
      "installedAt": "…",
      "source": "…",
      "sourceCommit": "…",
      "verifiedAtInstall": true,
      "files": [],
      "jsonMerges": [
        {
          "target": "settings.json",
          "path": "mcpServers.github",
          "before": null,
          "after": { "command": "…", "args": [] }
        }
      ],
      "sha256": "…"
    }
  ]
}
```

The `before` snapshot is critical — it allows `remove` to cleanly revert JSON merges.

**`sha256` semantics in the manifest.** The entry-level `sha256` field records the hash of the entry's primary content artifact — for file-based entries, the concatenated bytes of all `files[].source` in the order declared; for merge-based entries, the bytes of the referenced `snippetFile`; for presets, the bytes of `settingsPatch` if present, else the serialized `includes` list. This value is compared against the registry index at update time to detect upstream changes.

### 5.5 Offline / fallback behaviour

When MeiliSearch is unreachable, `clawforge search` falls back to a local substring + tag match against the cached `registry.json` (24 h cache). When `registry.json` itself is unreachable and no cache exists, the CLI returns a clear error with a `--registry` flag hint for self-hosted setups. `clawforge add` never depends on the search service and works offline against the cached registry.

---

## 6. Web UI (`clawforge.dev`)

### 6.1 Pages

| Path | Purpose |
|---|---|
| `/` | Landing — hero, search, featured, stats, CTAs |
| `/browse` | Filtered grid, sort controls |
| `/search?q=…` | Full-text results |
| `/[kind]/[slug]` | Entry detail (the star-conversion page) |
| `/submit` | Contribution guide + interactive entry.json builder |
| `/docs` | MDX docs index |
| `/docs/cli` | Auto-generated CLI reference |
| `/stats` | Public trending, most installed |
| `/author/[handle]` | Author page |
| `/tag/[tag]` | Tag landing — SEO |
| `/category/[category]` | Category landing — SEO |

### 6.2 Detail page (highest SEO value)

Shows metadata, rendered README (MDX), install command with copy button, exact file list that will be installed, Claude Code compat, requires/conflicts, verified badge, source PR link, related entries.

### 6.3 Design system

- Dark mode default (dev tooling convention), light toggle respects `prefers-color-scheme`.
- Tailwind 4 OKLCH palette.
- shadcn/ui components.
- Mobile-first.

### 6.4 SEO strategy

- Every entry has its own URL with unique meta + OG image (Satori auto-generated at build).
- `Schema.org/SoftwareSourceCode` markup per entry.
- `sitemap.xml` and `feed.xml` (RSS of recent entries) generated at build.
- Author, tag, and category pages are indexable (long-tail).

### 6.5 Search

Primary: MeiliSearch InstantSearch widget.

Fallback: Pagefind static index (so browse works even if MeiliSearch is unreachable).

---

## 7. CI/CD

### 7.1 Workflows

| File | Trigger | Purpose |
|---|---|---|
| `validate-pr.yml` | PR touching `registry/**` or `packages/schema/**` | Auto-gates |
| `publish-registry.yml` | push to `main` touching `registry/**` | Rebuild + push CDN + reindex MeiliSearch |
| `release-cli.yml` | tag `cli-v*` | npm publish CLI |
| `release-web.yml` | push to `main` touching `apps/web/**` | Deploy to Cloudflare Pages |
| `weekly-health.yml` | cron | Dead link check, issue creation |

### 7.2 Auto-gates (on PR)

| Check | Action on fail |
|---|---|
| schema-validate (Zod) | BLOCK |
| duplicate-detect | BLOCK |
| file-existence | BLOCK |
| security-scan (hook/MCP snippets) | BLOCK + human review |
| link-check | WARN |
| markdown-lint | WARN |
| preview-comment | info only |

### 7.3 Security scan rules

**BLOCK patterns (no override):**

- `rm -rf /`, `rm -rf $HOME`, `rm -rf ~`
- `curl … | (sh|bash|zsh|fish)` and `wget … | …`
- `eval "$(curl …)"`
- `dd if=/dev/zero`
- `> /dev/sda`
- `chmod 777`

**WARN patterns (acknowledgement required):**

- `sudo`
- External domains (not on allow-list)
- Reads from `~/.ssh/`, `~/.aws/`, `.env`
- Shell history reads
- Network egress combined with env var enumeration
- Heavy obfuscation (high escape density)

**Allow-list:** `anthropic.com`, `github.com`, `githubusercontent.com`, `cloudflare.com`, npm registry, `localhost`, `127.0.0.1`, known official MCP servers.

### 7.4 Build pipeline

`scripts/build-index.ts`:

1. Enumerate `registry/**/entry.json`.
2. For each entry: read metadata, compute `sha256`, resolve `createdAt`/`updatedAt` from `git log`. CI workflows must use `actions/checkout@v4` with `fetch-depth: 0` so that commit history is available for this step.
3. Merge `registry/_verified.json` → set `verified` flags.
4. Exclude entries listed in `registry/_removed.json` from main index; emit tombstones.
5. Write:
   - `dist/registry.json` (full index)
   - `dist/skills.json`, `dist/agents.json`, … (per-kind shards)
   - `dist/sitemap.xml`
   - `dist/feed.xml` (last 50 entries)
6. Upload artifacts to Cloudflare R2 via Wrangler.
7. Push documents to MeiliSearch (`replaceDocuments` semantics).
8. Trigger Cloudflare Pages rebuild for the web site.

Target build time: < 60 seconds.

### 7.5 Branch protection

- Require PR before merge to `main`.
- Required status checks: `schema-validate`, `duplicate-detect`, `file-existence`, `security-scan`.
- 1 maintainer approval required.
- Dismiss stale reviews on push.
- No force push, linear history.

### 7.6 Required secrets

- `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
- `MEILISEARCH_HOST`, `MEILISEARCH_API_KEY`
- `NPM_TOKEN`

### 7.7 Rollback

Cloudflare R2 versioning is enabled — rollback is a single `wrangler r2 object restore`. CI publishes `health.json` with timestamp + entry count for external monitoring.

---

## 8. Verified tier & security

### 8.1 Verification mechanism

`verified` is **not** an author-controlled field. It is derived at build time from `registry/_verified.json`, which is CODEOWNERS-protected — only maintainers can merge PRs that touch it.

`registry/_verified.json`:

```json
{
  "version": 1,
  "entries": {
    "skill:tdd-workflow": {
      "verifiedAt": "2026-04-15T12:00:00Z",
      "verifiedBy": "kalkan",
      "verifiedVersion": "1.2.0",
      "reason": "…",
      "expiresAt": null
    }
  }
}
```

Major version bumps reset `verified` to `false` — new version requires fresh review.

`.github/CODEOWNERS`:

```
/registry/_verified.json      @kalkan @maintainer2
/registry/_removed/           @kalkan @maintainer2
/.github/                     @kalkan
/packages/validator/          @kalkan
```

### 8.2 Verification checklist (maintainer uses before approval)

- LICENSE present (MIT / Apache-2.0 / BSD preferred)
- README complete (description, usage, examples, author contact)
- No security-scan warnings on current version
- Author GitHub account ≥ 30 days old, not flagged
- Purpose clear, non-trivial
- Works with current stable Claude Code
- Not a duplicate of an existing verified entry (unless materially better)
- External references reputable
- MCP/hook: env vars documented, no privilege escalation

Template lives at `.github/ISSUE_TEMPLATE/verify-request.md`.

### 8.3 Revocation

- Maintainer removes the entry from `_verified.json` — next CI run drops the badge.
- `weekly-health.yml` labels entries untouched for 180 days as `needs-revalidation`.
- Major version bump automatically invalidates the previous verification.

### 8.4 Sybil / abuse prevention

| Rule | Action |
|---|---|
| Author GitHub account < 30 days | `new-author` label, 1-day hold |
| > 5 entries from one author in 24 h | `rate-limit` label, manual review |
| New account requesting verification | Auto-reject, "build reputation first" comment |
| `entry.json` author.github ≠ PR author | BLOCK — identity mismatch |
| Name similarity > 80 % to a verified entry (Levenshtein) | `suspicious-impersonation` label |

Post-publish: download-rate anomalies flagged; ≥ 3 user reports → auto-hide pending review (`hidden: true` flag in CDN index).

### 8.5 Namespace rules

- Global namespace (`skill:foo`): first-come-first-served; maintainer review required for verification; reclaimable after 12 months of author inactivity.
- Scoped namespace (`skill:@user/foo`): author-isolated; only PRs by `@user` may write here.

### 8.6 Takedown flow

1. Report submitted (issue with `takedown-request` label or via `/report?entry=…`).
2. Maintainer triage within 24 h.
3. Move entry to `registry/_removed/<kind>/<name>/` and add tombstone to `registry/_removed.json` with reason and date.
4. CI rebuild → CDN index no longer lists the entry; `_removed.json` is served alongside the index.
5. `clawforge update` warns users when it encounters a removed entry, with cleanup option.
6. Public disclosure if security-related (GitHub Advisory).

### 8.7 Supply-chain protections (client side)

- Content integrity — sha256 of downloaded file verified against registry value; mismatch aborts install.
- Transparent writes — all paths and JSON diffs shown before execution.
- Manifest provenance — records source commit, sha256, and verified-at-install flag.
- `clawforge doctor` detects local tampering, missing files, and entries later added to `_removed.json`.

### 8.8 Deferred to v2

- Sigstore signing for cryptographic provenance
- Entry-level SBOM
- Reproducible-build verification
- Reputation scoring
- Maintainer 2FA enforcement (practical policy even without tooling)

---

## 9. Launch strategy

### 9.1 Seed content (launch-day floor: 50 entries)

| Kind | Count | Source |
|---|---|---|
| Skills | 20 | Owner's existing skill collection |
| Agents | 8 | Generic dev agents |
| Hooks | 6 | Auto-format, commit-lint, gitignore-sync, type-check-on-save, … |
| MCP servers | 5 | Well-known configs (github, filesystem, fetch, puppeteer, sqlite) — configs only |
| Slash commands | 5 | `/review`, `/test`, `/refactor`, `/docs`, `/plan` |
| Presets | 6 | TDD stack, security audit, docs stack, full-stack, Rust dev, Python dev |

All seed entries are MIT-licensed and authored by the owner. No re-publishing of others' content at launch; third-party content catalog-style only, linking to original sources.

**Content authoring is a parallel workstream.** Seed content is not a code-side deliverable — it is produced alongside the CLI / web / validator workstreams, not sequenced after them. The implementation plan should treat "produce seed entries" as an independent track that runs from day one and converges with the launch checklist.

### 9.2 Pre-launch checklist (T-14 to T-0)

- [ ] ≥ 50 entries live, all verified
- [ ] CLI published to npm, tested on macOS, Linux (Ubuntu), Windows (via WSL + Git Bash)
- [ ] `clawforge.dev` live, Lighthouse ≥ 95 (all four)
- [ ] Dark mode works, OG images render, Twitter card validated
- [ ] 5-second install GIF in README
- [ ] README badges: npm version, stars, license, CI status
- [ ] SEO: sitemap, robots.txt, OG images, Search Console verified
- [ ] Plausible Analytics installed
- [ ] Demo video (≈ 3 min) uploaded
- [ ] 5 beta testers completed a clean install
- [ ] Contribution guide + first-week FAQ ready
- [ ] HN / Reddit / Twitter draft copy ready in 3 variants

### 9.3 Launch day (Tuesday, 09:00 ET)

| T+ | Action |
|---|---|
| 0 | HN `Show HN: Clawforge – An npm-like registry for Claude Code skills and agents` |
| 0:30 | Twitter/X thread (9 tweets, GIF, screenshots) |
| 1:00 | r/ClaudeAI, r/programming, r/commandline posts |
| 2:00 | dev.to meta-article "How I built clawforge" |
| 4:00 | Newsletter pitches (TLDR Dev, Console.dev, Pointer.io, Terminal Trove) |
| D+1 | Discord communities |
| D+7 | YouTube demo video |

### 9.4 Momentum plan

| Week | Activity |
|---|---|
| 1 | Daily triage (< 6 h response to issues), fast-track requested entries |
| 2 | "Lessons from launch week" blog, metrics shared |
| 3 | "CLI tips & tricks" article, first contributor spotlight |
| 4 | Monthly digest email, milestone post |
| 5–8 | Weekly featured entry on Twitter/blog, community call on Discord |
| M3 | Podcast outreach (Changelog, Syntax.fm, SE Daily) |
| M6 | Conference talk pitches |

### 9.5 Growth loops

1. Every entry page has an "Add yours" CTA.
2. Verified badge doubles as status signal — authors share it.
3. Tag/category landing pages capture long-tail SEO.
4. Weekly digest email re-engages dormant users.
5. Author profile pages drive vanity sign-ups.
6. `/submit` pre-fills the PR body, collapsing contribution friction to ~1 minute.
7. `clawforge browse` inside the CLI redirects web traffic.

### 9.6 Success metrics (6 months)

| Metric | Launch | M1 | M3 | M6 |
|---|---|---|---|---|
| GitHub stars | 0 | 500 | 2 000 | 5 000 |
| npm weekly downloads | 0 | 500 | 3 000 | 10 000 |
| Total entries | 50 | 80 | 200 | 500 |
| Unique authors | 1 | 5 | 30 | 100 |
| Verified entries | 50 | 55 | 80 | 150 |
| Web site monthly visits | 0 | 3k | 15k | 50k |

### 9.7 Risks and mitigations

| Risk | Mitigation |
|---|---|
| Anthropic releases a first-party registry | Stay OSS, propose collaboration, leverage first-mover advantage |
| Low contribution rate | Aggressive author outreach, featured spots, contributor perks |
| Malicious entry incident | Takedown SLA 24 h, public playbook, security-only disclosure channel |
| CDN / MeiliSearch cost spike | Monitor free-tier limits, fallback to GitHub raw, Pagefind fallback for search |
| Maintainer burnout | 2–3 core maintainers, aggressive bot automation |

---

## 10. Testing strategy

| Package | Framework | Coverage target |
|---|---|---|
| `@clawforge/cli` | Vitest + fs-mock | ≥ 80 %, integration tests for every installer path (including conflict branches) |
| `@clawforge/schema` | Vitest | ≥ 95 % — schemas are load-bearing |
| `@clawforge/validator` | Vitest + golden-file fixtures for each BLOCK/WARN pattern | ≥ 90 % |
| `@clawforge/web` | Playwright | Critical flows: landing → detail → copy install command; search; submit flow |
| Registry seed content | Snapshot tests ensure each seed entry validates and builds | 100 % |

E2E smoke pipeline runs on each PR: validate-pr-fixture → build-index → start MeiliSearch container → CLI `add skill:<fixture>` against a local registry server.

The "local registry server" is a minimal static file server (e.g. `serve` or a 20-line Node handler) that exposes the `dist/` output of `build-index` at `http://127.0.0.1:<port>/`. The CLI points at it via `--registry http://127.0.0.1:<port>`. No custom runtime is needed — it is strictly static hosting.

---

## 11. Open questions

None blocking. Tracked deferrals:

- Dependency resolution for `requires` (currently advisory, not enforced at install).
- Semver range support in `requires`/`conflicts`.
- `clawforge publish` helper command (v2).
- Sigstore signing and entry SBOMs (v2).

**Phase progress:**

- Phase 1 (`@clawforge/schema`): ✅ complete — tag `phase-1-schema-complete`, 70 tests green, coverage 100 % lines / 97.5 % branches, build artefacts produced.
- Phase 2 (`@clawforge/build-index`): ✅ complete — tag `phase-2-build-index-complete`, coverage thresholds met (~93 % lines / ~85 % branches / 100 % funcs), fixture-based e2e test green, CLI + root `build:index` script wired.
- Phase 3 (`@clawforge/validator`): ✅ complete — tag `phase-3-validator-complete`, 16 tests green (4 checkers + orchestrator + types), coverage thresholds met, CLI demonstrably blocks a `rm -rf /` fixture snippet.
- Phase 4 (`@clawforge/cli`): ✅ complete — tag `phase-4-cli-complete`, 55 tests green, all 9 commands wired (init/add/list/info/search/remove/update/doctor/browse), e2e add → list → remove smoke test green. Preset installer deferred to v2 (documented).
- Phase 5 (`@clawforge/web`): ✅ complete — tag `phase-5-web-complete`, Astro SSG with 7 static routes (landing, browse, docs, 4 detail pages from `getStaticPaths`), dark-mode default, client-side browse filters verified live in preview. Submit / stats / author / tag / category pages deferred to post-MVP.
- Phase 6 (CI/CD + governance): ✅ complete — tag `phase-6-cicd-complete`, 5 workflows (`validate-pr`, `publish-registry`, `release-cli`, `release-web`, `weekly-health`), CODEOWNERS wired, PR + issue templates, SECURITY.md, branch-protection playbook documented at `docs/BRANCH_PROTECTION.md`.
- Phase 7 (verified tier tooling): ✅ complete — tag `phase-7-verified-complete`. `registry/` seeded with empty `_verified.json` and `_removed.json`, `registry/README.md` explains contribution flow, `docs/MAINTAINER_PLAYBOOK.md` covers verification / revocation / takedown / incident response / onboarding. Validator + build-index pipeline end-to-end-tested against the live empty registry.
- Phase 8 (seed content): ✅ shipped **12 of 50** — tag `phase-8-seed-complete`. Covers every kind (4 skills, 2 agents, 2 cmds, 2 hooks, 1 mcp, 1 preset), 4 verified, real data flowing through build-index into the Astro site's data loader, preview-verified live. Remaining 38 captured in `docs/SEED_BACKLOG.md`. Two bugs found and fixed in the process: build-index passed registry-relative paths to `git log` (now absolute), and git `%aI` returns tz offsets rather than Z-suffixed UTC (now normalised).
- Phase 9 (launch readiness): ✅ complete — tag `phase-9-launch-complete`. Top-level README rewritten with badges + quickstart + self-host guide, CONTRIBUTING.md covers entry authoring flow, FAQ.md answers first-week questions, LAUNCH_COPY.md has ready-to-post HN / Reddit / X / dev.to / newsletter drafts, robots.txt wired. 176 tests green, lint clean, all 9 phases merged to master.

---

## 12. Approvals

- **Owner:** @kalkan — approved 2026-04-18 via brainstorming session.
- **Spec review:** pending (spec-document-reviewer agent).
- **Implementation plan:** pending (`writing-plans` skill after spec review passes).
