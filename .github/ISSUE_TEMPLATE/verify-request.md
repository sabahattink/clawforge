---
name: Verification request
about: Request promotion of an entry to the verified tier
title: "[verify] <entry-id>"
labels: ["verification-request"]
---

## Entry

- Entry id: `skill:foo` (or `agent:bar`, etc.)
- Version requesting verification for: `vX.Y.Z`

## Maintainer checklist (filled by reviewer)

- [ ] LICENSE present (MIT / Apache-2.0 / BSD / CC0)
- [ ] README has description, usage, examples, author contact
- [ ] No security-scan warnings on the current version
- [ ] Author's GitHub account is ≥ 30 days old and not flagged
- [ ] Entry purpose is clear and non-trivial
- [ ] Works with current stable Claude Code
- [ ] Not a duplicate of an existing verified entry (unless materially better)
- [ ] External references (if any) are to reputable sources
- [ ] For MCP / hook entries: env vars documented, no privilege escalation

## Why this entry deserves verification

<!-- Brief rationale: traction, author reputation, unique value, etc. -->
