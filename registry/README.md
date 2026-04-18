# Registry

Source of truth for every entry served at `cdn.clawmart.dev`.

## Layout

```
registry/
├── skills/<slug>/
│   ├── entry.json
│   ├── SKILL.md        (content)
│   └── README.md       (detail page source)
├── agents/<slug>/...
├── commands/<slug>/...
├── hooks/<slug>/...
├── mcp-servers/<slug>/...
├── presets/<slug>/...
├── _verified.json      (maintainer-only; CODEOWNERS-protected)
└── _removed.json       (maintainer-only; tombstones)
```

## Adding an entry

1. Fork the repo.
2. Create your directory under the right kind: e.g. `registry/skills/my-skill/`.
3. Add `entry.json` (see [schema](../packages/schema/README.md)).
4. Add the content files declared by `files[].source` (or `snippetFile` / `settingsPatch`).
5. Open a PR — CI auto-gates run (schema, duplicates, file existence, security).
6. Use the PR template.

## Verification

You cannot set `verified: true` in your own `entry.json` — the build pipeline ignores that flag. The CDN-served index reads verified state exclusively from `registry/_verified.json`, which is CODEOWNERS-protected. To request verification, open a [verify-request issue](../.github/ISSUE_TEMPLATE/verify-request.md).

## Takedowns

Report malicious / broken / IP-violating entries via the [takedown template](../.github/ISSUE_TEMPLATE/takedown-request.md). Security issues should go through [SECURITY.md](../SECURITY.md) first.

## Namespacing

- Global: `skill:foo` — first-come-first-served, reclaimable after 12 months of author inactivity.
- Scoped: `skill:@user/foo` — author-isolated. PR author must match the handle.
