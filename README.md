# 🐾 clawforge

> The registry for Claude Code. Install skills, agents, hooks, and MCP servers with one command.

[![npm version](https://img.shields.io/npm/v/@clawforge/cli.svg?logo=npm)](https://www.npmjs.com/package/@clawforge/cli)
[![CI](https://img.shields.io/github/actions/workflow/status/kalkan/clawforge/validate-pr.yml?branch=main&logo=github)](https://github.com/kalkan/clawforge/actions)
[![License: MIT](https://img.shields.io/badge/license-MIT-brightgreen.svg)](LICENSE)
[![Node](https://img.shields.io/node/v/@clawforge/cli)](package.json)

```bash
npx clawforge add skill:tdd-workflow
```

That's it. One command installs a Claude Code skill — as a plain file under `~/.claude/skills/`, which you can read, edit, or delete. No lock-in. No magic. Shadcn-style: **you own the code**.

---

## What clawforge does

- 🗂 **Registry** of curated skills, agents, hooks, MCP configs, slash commands, and presets.
- 📦 **One-command install** via `npx clawforge add <id>` — works on macOS, Linux, and Windows (Git Bash / WSL).
- 🔄 **Fully reversible** — every install records a `before` snapshot; `remove` restores it cleanly.
- ✅ **Verified tier** — maintainer-reviewed entries carry a verified badge you can trust.
- 🔐 **Security-gated** — every PR runs a scanner that blocks `rm -rf`, `curl | sh`, and friends.
- 🌐 **Self-hostable** — swap the CDN via `--registry` and run your own registry in 10 lines of YAML.

---

## Quickstart

### Install the CLI

```bash
npm install -g @clawforge/cli
# or use npx on demand: npx clawforge ...
```

### Initialise a manifest

```bash
clawforge init
```

### Find an entry

```bash
clawforge search tdd
```

### Install it

```bash
clawforge add skill:tdd-workflow --track
```

The file lands at `~/.claude/skills/tdd-workflow/SKILL.md`. Open it, read it, edit it — it's yours now.

### Remove it

```bash
clawforge remove skill:tdd-workflow
```

Everything the install wrote is reverted, including JSON-merge entries in `settings.json`.

---

## Supported entry kinds

| Kind | What it is | Installs to |
|---|---|---|
| `skill:` | A reusable skill (SKILL.md) | `~/.claude/skills/<name>/SKILL.md` |
| `agent:` | A subagent definition | `~/.claude/agents/<name>.md` |
| `cmd:` | A slash command | `./.claude/commands/<name>.md` |
| `hook:` | A PreToolUse / PostToolUse snippet | merged into `~/.claude/settings.json` |
| `mcp:` | An MCP server config | merged into `~/.claude/settings.json` |
| `preset:` | A curated bundle of the above | recursively installs each |

---

## How it stays safe

- **Schema validation** on every entry (Zod).
- **Security scanner** blocks dangerous shell patterns in hook/MCP snippets (see [validator](packages/validator/README.md)).
- **Content integrity** via sha256 — the CLI verifies every install against the registry's hash.
- **Verified tier** — the `verified` badge comes from `registry/_verified.json`, a CODEOWNERS-protected file only maintainers can edit.
- **Takedowns in < 24 h** — see [SECURITY.md](SECURITY.md) and the [maintainer playbook](docs/MAINTAINER_PLAYBOOK.md).

---

## Contribute

PRs welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for the entry schema, quality bar, and PR template.

Quick version: fork, create your entry under `registry/<kind>/<slug>/`, open a PR, watch the CI auto-gates run.

---

## Monorepo layout

```
clawforge/
├── apps/web/               clawforge.dev (Astro site)
├── packages/
│   ├── schema/             @clawforge/schema (Zod schemas)
│   ├── build-index/        @clawforge/build-index (CI artefacts)
│   ├── validator/          @clawforge/validator (CI auto-gates)
│   └── cli/                @clawforge/cli (npx clawforge)
├── registry/               source of truth for every entry
└── docs/                   spec, plans, playbooks
```

---

## Self-host

```bash
pnpm install
pnpm --filter @clawforge/build-index build
node packages/build-index/dist/bin.js \
  --registry ./my-registry \
  --out ./dist \
  --cdn-base https://my-cdn.example.com \
  --site-base https://my-clawforge.example.com
```

Upload `dist/` to any static host. Point your `clawforge` CLI at it:

```bash
clawforge add --registry https://my-cdn.example.com skill:foo
```

---

## Status

Pre-launch. 12 seed entries shipped across every kind. Remaining 38 tracked in [docs/SEED_BACKLOG.md](docs/SEED_BACKLOG.md).

Design spec: [docs/superpowers/specs/2026-04-18-clawforge-design.md](docs/superpowers/specs/2026-04-18-clawforge-design.md).

---

## License

MIT © 2026 Sabahattin Kalkan.
