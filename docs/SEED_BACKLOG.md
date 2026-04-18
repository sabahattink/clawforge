# Seed content backlog

Launch target was 50 entries. Phase 8 shipped **12** to demonstrate every kind and fill the web site with variety. The remaining **38** below are a maintainer backlog — write them opportunistically pre- and post-launch.

## Shipped (12)

| Kind | Name | Verified |
|---|---|---|
| skill | `tdd-workflow` | ✓ |
| skill | `systematic-debugging` | ✓ |
| skill | `receiving-code-review` | |
| skill | `writing-plans` | |
| agent | `code-reviewer` | ✓ |
| agent | `planner` | |
| cmd | `/review` | |
| cmd | `/test` | |
| hook | `auto-format-ts` | |
| hook | `commit-msg-lint` | |
| mcp | `filesystem` | |
| preset | `strict-tdd` | ✓ |

## Backlog (target: 38)

### Skills (target: +16 → 20 total)

- [ ] `brainstorming` — turn an idea into a design via Q&A
- [ ] `verification-before-completion` — checklist before claiming done
- [ ] `skill-creator` — how to write a good skill
- [ ] `requesting-code-review` — the counterpart to receiving
- [ ] `finishing-a-development-branch` — merge flow checklist
- [ ] `using-git-worktrees` — when and how
- [ ] `dispatching-parallel-agents` — for independent tasks
- [ ] `subagent-driven-development` — execution via subagents
- [ ] `continuous-learning` — extract reusable patterns
- [ ] `strategic-compact` — manual compaction decisions
- [ ] `token-budget-advisor` — pick response depth
- [ ] `documentation-lookup` — use Context7 vs training data
- [ ] `search-first` — before writing new code
- [ ] `regex-vs-llm-structured-text` — picking the right tool
- [ ] `api-design` — REST conventions
- [ ] `database-migrations` — schema change safety

### Agents (target: +6 → 8 total)

- [ ] `security-reviewer` — OWASP + crypto
- [ ] `architect` — system design
- [ ] `tdd-guide` — enforces red-green-refactor in-session
- [ ] `build-error-resolver` — minimal-diff build fixes
- [ ] `refactor-cleaner` — dead code removal
- [ ] `doc-updater` — keeps docs in sync

### Hooks (target: +4 → 6 total)

- [ ] `no-console-log` — PreToolUse rejecting `console.log` writes
- [ ] `gitignore-sync` — ensure `.gitignore` covers common build artefacts
- [ ] `pkg-lock-reminder` — remind to update lockfile when package.json changes
- [ ] `secret-scan` — PreToolUse reject if new secrets pattern detected

### MCP servers (target: +4 → 5 total)

- [ ] `github` — official GitHub MCP config
- [ ] `fetch` — official fetch server config
- [ ] `puppeteer` — browser automation
- [ ] `sqlite` — read-only DB exploration

### Commands (target: +3 → 5 total)

- [ ] `/refactor` — scoped refactor with safety checks
- [ ] `/docs` — update docs for a changed module
- [ ] `/plan` — dispatch planner agent

### Presets (target: +5 → 6 total)

- [ ] `security-audit` — security-reviewer + secret-scan + no-console-log
- [ ] `docs-stack` — doc-updater + /docs + writing-plans
- [ ] `full-stack-dev` — tdd + code-reviewer + auto-format + security-reviewer
- [ ] `rust-dev` — rust-specific stack
- [ ] `python-dev` — python-specific stack

## How to work through the backlog

1. Pick one. Draft `entry.json` + content.
2. `pnpm validate` locally.
3. PR it as you would an external contributor.
4. Merge, let `publish-registry.yml` do the rest.
5. Mark the box above in the next PR.

## Quality bar

- Every entry must be MIT-licensed and author-approved.
- Content should stand alone — no internal jargon, no placeholder text.
- Descriptions ≤ 160 chars, tags ≤ 5, focused category.
- For hooks/MCP: env vars documented, no privilege escalation.

When an entry hits the quality bar, consider adding it to `_verified.json` in the same PR.
