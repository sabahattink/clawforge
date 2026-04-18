# Maintainer playbook

Day-to-day operations for clawmart maintainers. Everything here assumes you're listed in `.github/CODEOWNERS`.

---

## Verify an entry

Triggered by a `verification-request` issue.

**Checklist** (mirrors the one in the issue template):

- [ ] LICENSE present (MIT / Apache-2.0 / BSD / CC0)
- [ ] README has description, usage, examples, author contact
- [ ] `pnpm --filter @clawmart/validator build && node packages/validator/dist/bin.js --registry registry` — no BLOCK / WARN on this entry
- [ ] Author GitHub account ≥ 30 days old, not flagged
- [ ] Entry purpose is clear and non-trivial
- [ ] Works with current stable Claude Code
- [ ] Not a duplicate of an existing verified entry (unless materially better)
- [ ] External references reputable
- [ ] MCP / hook: env vars documented, no privilege escalation

**Applying verification:**

1. Open `registry/_verified.json`.
2. Add the entry to `entries` with `verifiedVersion` set to the exact version you reviewed. Major version bumps invalidate the badge.
3. Commit on `main` (must be a PR from a fresh branch since branch protection blocks direct pushes).
4. `publish-registry.yml` runs automatically; new index is live on the CDN within ~2 minutes.
5. Close the issue with a comment linking the commit.

Example entry:

```json
"skill:tdd-workflow": {
  "verifiedAt": "2026-04-19T12:00:00.000Z",
  "verifiedBy": "kalkan",
  "verifiedVersion": "1.2.0",
  "reason": "Well-documented, MIT-licensed, actively maintained.",
  "expiresAt": null
}
```

---

## Revoke verification

- Remove the entry from `registry/_verified.json` (or set `expiresAt` in the past).
- Merge via PR.
- The badge drops at the next CDN publish.

---

## Handle a takedown

Triggered by a `takedown-request` issue (or direct security report).

1. **Confirm** within 24 hours. Categorise: malicious / broken / ip-violation / author-request / security.
2. **Move the entry:**
   ```bash
   mkdir -p registry/_removed/<kind>/<slug>
   git mv registry/<kind>/<slug>/* registry/_removed/<kind>/<slug>/
   ```
3. **Update tombstones** — add to `registry/_removed.json`:
   ```json
   "<kind>:<slug>": {
     "removedAt": "<ISO timestamp>",
     "reason": "<short reason>",
     "category": "<malicious|broken|ip-violation|author-request|security>"
   }
   ```
4. **Open a PR** on a maintainer branch. Branch protection + CODEOWNERS ensure this requires maintainer approval.
5. **Merge** — `publish-registry.yml` pushes the new index. Users running `clawmart update` against the old id will see a warning.
6. **Close the issue** with a comment linking the PR and the tombstone entry.
7. **Public disclosure** (security category only):
   - File a [GitHub Security Advisory](https://docs.github.com/en/code-security/security-advisories/repository-security-advisories).
   - Credit the reporter unless they declined.

---

## Incident response — malicious entry landed

If a malicious entry made it past the auto-gates and into the CDN:

1. **Revert** the CDN immediately via `wrangler r2 object restore` on `registry.json` to the previous version (R2 versioning is enabled).
2. File the takedown per the flow above.
3. **Root-cause** the detector gap — add a new BLOCK pattern to `packages/validator/src/checks/security.ts` and bump the package version.
4. Post-incident: publish a short note in the repo's GitHub Discussions.

---

## Release the CLI

```bash
git tag cli-v0.1.0
git push --tags
```

`release-cli.yml` runs tests, publishes `@clawmart/cli` to npm, and creates a GitHub Release with auto-generated notes.

---

## Weekly health check

`weekly-health.yml` runs every Monday 03:00 UTC. If it opens an issue with `health-check` label, triage within a week:

- Broken external link → ping author (check the entry's README), or remove via the takedown flow if author is unresponsive for 30+ days.
- Validator failure → typically indicates a schema evolution — update the affected entries.

---

## Adding a new maintainer

1. Add their handle to `.github/CODEOWNERS`.
2. Invite them to the `clawmart` npm org (`npm org set clawmart <user>` as a developer).
3. Grant them repo write access on GitHub.
4. Add them to the branch-protection "Allowed actors" list for `registry/_verified.json`.
5. Run through the onboarding section below with them.

---

## Maintainer onboarding checklist

- [ ] GitHub handle added to CODEOWNERS
- [ ] Local checkout works (`pnpm install && pnpm -r test` passes)
- [ ] Can reproduce the `build-index` pipeline locally (`pnpm build:index`)
- [ ] Can reproduce validator BLOCK against fixtures
- [ ] Read this playbook + SECURITY.md + the design spec (`docs/superpowers/specs/2026-04-18-clawmart-design.md`)
- [ ] 2FA enabled on GitHub and npm
- [ ] GPG signing configured (optional but recommended)
