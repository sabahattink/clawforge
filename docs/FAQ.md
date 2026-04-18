# FAQ

Answers for first-week questions. Update as real ones come in.

---

## Why would I use clawmart over just copying snippets from a README?

Three reasons:

1. **One command.** `npx clawmart add skill:tdd-workflow` vs "clone this repo, find the file, copy it into ~/.claude/skills/, make sure you edit settings.json for the hook..."
2. **Reversibility.** The manifest records everything, so `clawmart remove` cleanly reverts.
3. **Security layer.** The registry rejects entries with obviously dangerous hook snippets before they even land.

If you only ever install two skills and never change them, a README copy-paste is fine. If you install more than a handful, clawmart pays for itself.

---

## Is this Anthropic-official?

No. clawmart is an independent open-source project, MIT-licensed, maintained by [@kalkan](https://github.com/kalkan) and contributors. It does not speak for Anthropic and does not distribute Anthropic proprietary code.

---

## Does clawmart run code on my machine?

The CLI runs. Entries themselves are static content:

- Skills, agents, commands → markdown files
- Hooks, MCP configs → JSON snippets merged into your `settings.json`

The hooks you install *will* run when Claude Code triggers them — that's the point. That's why the registry scans hook snippets for dangerous patterns before accepting them, and why the `verified` tier exists for high-trust entries.

---

## What stops someone publishing a malicious skill?

Layered defences:

1. **PR auto-gates** — schema validation, duplicate detection, security scanner (blocks `rm -rf`, `curl | sh`, `eval`-curl, etc.).
2. **Maintainer review** — every merge goes through a CODEOWNER.
3. **sha256 verification** — the CLI checks the downloaded content against the registry's hash.
4. **Takedown SLA** — maintainers triage reported entries within 24 hours. Tombstones stay in `registry/_removed.json` so old CLIs are warned.
5. **Verified tier** — not a promise, but a strong signal that a maintainer reviewed the specific version.

None of this makes running random community code safe by default. Treat unverified entries the way you'd treat an unreviewed GitHub gist.

---

## Does the CLI phone home?

No. The CLI fetches the registry index and the entry files you ask for. There's no telemetry, no account, no login. If you pass `--registry https://your-own.example`, it talks only to your own server.

---

## How do I self-host?

```bash
pnpm install
pnpm --filter @clawmart/build-index build
node packages/build-index/dist/bin.js \
  --registry ./your-registry \
  --out ./dist \
  --cdn-base https://your-cdn.example.com \
  --site-base https://your-site.example.com
```

Upload the `dist/` folder to any static host. Point the CLI at it with `--registry https://your-cdn.example.com`.

The full schema for entries is in [`packages/schema`](../packages/schema/README.md).

---

## I made a skill I want everyone to have. How do I publish it?

See [CONTRIBUTING.md](../CONTRIBUTING.md). TL;DR:

1. Fork the repo.
2. Create `registry/<kind>/<slug>/` with `entry.json` and the content file.
3. `pnpm validate` locally.
4. Open a PR — CI auto-gates run.
5. A maintainer reviews and merges.

---

## Why do I need `--track`?

Without it, clawmart writes the file and forgets about it. You own the file, but `clawmart update` / `remove` can't manage it because there's no manifest record.

Use `--track` if you want clawmart to keep managing the entry (most people do).

---

## The install prompted me about a conflict. What happened?

A file already exists at the target path. Options:

- **Overwrite** — replace with the registry version.
- **Skip** — keep what's there.
- **Backup and install** — rename the existing file to `.bak` and write the new one.

Pass `--force` to auto-overwrite without prompting. Pass `--dry-run` to see the plan without writing.

---

## My hook isn't running after install. Why?

Three common causes:

1. **settings.json isn't picked up** — make sure you ran `clawmart init` first, which confirms the scope is right.
2. **The hook matcher doesn't match** — open `~/.claude/settings.json`, find the hooks array, and check the `matcher` regex against the tool name Claude Code uses.
3. **Claude Code wasn't restarted** — some hook configs require a restart.

Run `clawmart doctor` to verify the install is intact.

---

## Can I use clawmart with a non-Anthropic coding agent?

Technically — the entries are just files + JSON snippets. Practically — most entries assume Claude Code's specific settings.json shape and tool names. Forking for another agent is reasonable; the build pipeline and CLI are agent-agnostic.

---

## How do I get my entry verified?

Open a `verification-request` issue. A maintainer goes through the checklist in `.github/ISSUE_TEMPLATE/verify-request.md`. If it passes, they add your entry to `registry/_verified.json` in a separate PR. Major version bumps reset the badge — you re-request on each major.

---

## Something's broken / I have a security concern

- **Bug** → GitHub Issue with the bug template.
- **Malicious entry** → `takedown-request` issue template.
- **Security in clawmart itself** → email (see [SECURITY.md](../SECURITY.md)), don't file public issues.
