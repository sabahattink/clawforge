# Next Session — Entry Point

**Last session end:** 2026-04-19 (pre-launch state)
**Repo:** https://github.com/sabahattink/clawforge
**Working tree:** clean, `master` up to date with origin
**Local path:** `H:/60_OSS/clawforge/`

---

## What shipped so far

### Code (9 phases complete + rename)

| Phase | Package | Tag |
|---|---|---|
| P1 | `@clawforge/schema` | `phase-1-schema-complete` |
| P2 | `@clawforge/build-index` | `phase-2-build-index-complete` |
| P3 | `@clawforge/validator` | `phase-3-validator-complete` |
| P4 | `@clawforge/cli` (9 commands) | `phase-4-cli-complete` |
| P5 | `@clawforge/web` (Astro, 7 pages) | `phase-5-web-complete` |
| P6 | 5 GitHub Actions workflows + CODEOWNERS | `phase-6-cicd-complete` |
| P7 | Verified tier + maintainer playbook | `phase-7-verified-complete` |
| P8 | 12 seed entries (4 verified) | `phase-8-seed-complete` |
| P9 | README + CONTRIBUTING + FAQ + LAUNCH_COPY | `phase-9-launch-complete` |
| — | project rename `clawmart` → `clawforge` | `rename-to-clawforge-complete` |

Totals: **176 tests green**, lint clean, 10 tags, all merged to `master`.

### Published to npm

- `@clawforge/schema@0.0.1`
- `@clawforge/build-index@0.0.1`
- `@clawforge/validator@0.0.1`
- `@clawforge/cli@0.0.1`

Try: `npx @clawforge/cli --help`

### GitHub live

- Repo: https://github.com/sabahattink/clawforge
- Topics: `claude-code, skills, cli, registry, typescript, mcp, agents, anthropic, claude, npm`
- Discussions + Issues + Wiki: enabled
- Issue #1: [Call for contributors](https://github.com/sabahattink/clawforge/issues/1)
- Discussion #2: [clawforge v0.0.1 is live](https://github.com/sabahattink/clawforge/discussions/2)

---

## Do next (in priority order)

### Launch path — morning session work

1. **Pin Discussion #2** (web UI only) — https://github.com/sabahattink/clawforge/discussions/2 → sağ üst menü → Pin discussion.
2. **Add `NPM_TOKEN` to GitHub Secrets** — required for CI auto-publish on tag push.
   - Generate fresh granular token at https://www.npmjs.com/settings/sabahattinkalkan/tokens (scope: `@clawforge`, read-and-write, bypass 2FA).
   - Settings → Secrets and variables → Actions → New secret → Name `NPM_TOKEN`, Value `<token>`.
   - Or via CLI: `printf '%s' '<token>' | gh secret set NPM_TOKEN --repo sabahattink/clawforge`
3. **`clawforge.dev` domain** — when purchased:
   - Cloudflare Pages project: `clawforge` → connect `sabahattink/clawforge` → build command `pnpm --filter @clawforge/web build`, output `apps/web/dist`
   - DNS: CNAME `@` and `www` to `clawforge.pages.dev`
4. **Show HN post** — draft ready in `docs/LAUNCH_COPY.md`. Tuesday 09:00 ET (16:00 TRT) is the historical sweet spot.
5. **Smoke test from a clean machine** — `npm install -g @clawforge/cli && clawforge --help` to verify publish consistency.

### Content backlog (no deadline)

- `docs/SEED_BACKLOG.md` lists 38 remaining entries (target 50).
- Work through opportunistically pre-launch to thicken the registry.

### Deferred (v2)

- Preset installer recursive fetch — currently errors on `add preset:...`.
- MeiliSearch-backed fuzzy search in CLI (MVP uses local substring match).
- Sigstore signing / entry-level SBOM.
- `clawforge publish` helper command.

---

## Gotchas to remember

- **`.npmrc` handling:** don't let tokens stack. Use `-Encoding ASCII` with `Out-File` without `-Append`. If in doubt, `Remove-Item "$env:USERPROFILE\.npmrc"` and re-establish.
- **Never paste tokens in chat.** Two earlier exposed tokens have been revoked; keep the current one strictly local.
- **GitHub handle** is `sabahattink`, full name is `Sabahattin Kalkan`. Tests and fixtures use `"github": "sabahattink"`.
- **pnpm `--otp` doesn't forward properly** in some setups. Use a granular token with 2FA bypass instead.
- **Domain defaults:** CDN `cdn.clawforge.dev`, site `clawforge.dev`. Hardcoded in README, launch copy, workflows. When adjusting, grep first.
- **Preview launch config** lives at `H:/.claude/launch.json` under name `clawforge-web`.

---

## How to resume

1. Open a fresh Claude Code session in `H:/60_OSS/clawforge/`.
2. Say: "Resume clawforge — read `docs/superpowers/NEXT_SESSION.md`."
3. Pick an item from "Do next" above.

Everything needed for context (spec, phase plans, playbooks) lives under `docs/`.
