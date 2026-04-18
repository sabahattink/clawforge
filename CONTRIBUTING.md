# Contributing to clawforge

Thanks for taking the time. clawforge gets better when contributors add battle-tested skills, agents, and configs they already use.

## Ways to contribute

1. **Add an entry** (skill / agent / hook / MCP / slash command / preset).
2. **Fix a bug** in the CLI / validator / build-index / web site.
3. **Improve docs** — anything in `docs/` or a package README.
4. **Report a takedown** — use the issue template if you see something malicious.
5. **Security report** — see [SECURITY.md](SECURITY.md). Never file public issues.

---

## Add a new entry

### 1. Fork & clone

```bash
gh repo fork kalkan/clawforge --clone
cd clawforge
pnpm install
```

### 2. Create the directory

Pick a slug (kebab-case, starts with a letter, ≤ 64 chars).

```
registry/<kind-dir>/<slug>/
├── entry.json
└── <content file>
```

Kind directories:

- `skills/`
- `agents/`
- `commands/`
- `hooks/`
- `mcp-servers/`
- `presets/`

### 3. Write `entry.json`

Start from an existing entry as a template. Required fields:

```json
{
  "kind": "skill",
  "name": "your-slug",
  "displayName": "Your Skill",
  "description": "One-liner under 160 characters.",
  "author": { "name": "Your Name", "github": "your-handle" },
  "tags": ["one", "two"],
  "category": "testing",
  "version": "1.0.0",
  "license": "MIT",
  "verified": false,
  "createdAt": "2026-04-19T00:00:00.000Z",
  "updatedAt": "2026-04-19T00:00:00.000Z",
  "sourceCommit": "0000000000000000000000000000000000000000",
  "sha256": "0000000000000000000000000000000000000000000000000000000000000000",
  "files": [
    { "source": "SKILL.md", "target": "{{CLAUDE_DIR}}/skills/{{name}}/SKILL.md" }
  ]
}
```

The build pipeline overwrites `createdAt`, `updatedAt`, `sourceCommit`, and `sha256` from git history at publish time — dummy values are fine in your PR.

### 4. Add the content file

- Skills → `SKILL.md`
- Agents → `agent.md`
- Slash commands → `command.md`
- Hooks → `hook.json` (a `settings.json` snippet)
- MCP → `mcp.json`
- Presets → (no content; just `entry.json` with an `includes` array)

### 5. Validate locally

```bash
pnpm --filter @clawforge/schema build
pnpm --filter @clawforge/build-index build
pnpm --filter @clawforge/validator build
pnpm validate
```

This runs schema validation, duplicate detection, file-existence checks, and the security scanner. The CI does the same — make it green locally first.

### 6. Open a PR

The PR template has a checklist. Fill it in.

- The `validate-pr.yml` workflow runs automatically.
- Your `entry.json` author handle must match your GitHub handle.
- `verified` will stay `false` — maintainers add entries to `registry/_verified.json` in a separate PR.

### 7. Ship

A maintainer reviews + merges. The `publish-registry.yml` workflow pushes the new index to the CDN within ~2 minutes.

---

## Quality bar

We'll request changes on PRs that fall below:

- **MIT / Apache-2.0 / BSD / CC0** licensed only.
- **Self-contained** — no mystery internal jargon, no placeholder "TODO" text.
- **Descriptions ≤ 160 chars** — if you can't describe it in one line, it's too many things.
- **Tags ≤ 5** — discoverability, not SEO stuffing.
- **Security-clean** — hooks/MCP snippets that trip the BLOCK scanner get rejected; WARN patterns need a reviewer-acknowledged comment.
- **Non-trivial** — "prints hello world" isn't a skill.

---

## Fix a bug / improve docs

Standard GitHub flow:

1. Fork, branch from `main`.
2. Conventional-commit your changes (`fix:`, `feat:`, `docs:`, `chore:`).
3. `pnpm lint && pnpm -r test` — keep both green.
4. Open a PR. Reference the issue if there is one.

---

## Development setup

```bash
pnpm install
pnpm -r build     # warms workspace dependencies
pnpm -r test      # all test suites
pnpm lint         # Biome (formatter + linter)
```

To run the dev web server:

```bash
pnpm --filter @clawforge/web dev
```

To rebuild the web site's data from the current registry:

```bash
pnpm --filter @clawforge/build-index build
node packages/build-index/dist/bin.js \
  --registry ./registry \
  --out apps/web/data \
  --cdn-base https://cdn.clawforge.dev \
  --site-base https://clawforge.dev \
  --generated-at "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
```

---

## Code of conduct

Be kind. Assume good faith. If you wouldn't say it to someone's face, don't say it in a PR comment.

---

## Questions?

Open a GitHub Discussion, or email sabahattin.kalkan@outlook.com.
