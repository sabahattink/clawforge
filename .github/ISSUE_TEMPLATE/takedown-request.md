---
name: Takedown request
about: Report an entry that should be removed (malicious / broken / IP violation)
title: "[takedown] <entry-id>"
labels: ["takedown-request", "needs-triage"]
---

## Entry

- Entry id: `skill:foo` (or `agent:bar`, etc.)
- Detail URL: https://cdn.clawforge.dev/...

## Category

- [ ] Malicious (security risk, data exfiltration, destructive)
- [ ] Broken (no longer functional, dead external dependency)
- [ ] IP violation (unauthorised copy, license mismatch)
- [ ] Author request (original author requests removal)
- [ ] Security (CVE-adjacent issue disclosed privately — see SECURITY.md first)

## Evidence

<!-- Link to code, screenshot, or reproduction. For security issues, prefer SECURITY.md disclosure first. -->

## Maintainer action (filled during triage)

- [ ] Confirmed within 24h SLA
- [ ] Entry moved to `registry/_removed/<kind>/<name>/`
- [ ] `registry/_removed.json` updated with reason + timestamp
- [ ] CDN rebuild triggered
- [ ] Public disclosure drafted (if security)
