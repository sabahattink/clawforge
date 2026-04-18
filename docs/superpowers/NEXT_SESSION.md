# Next Session — Entry Point

**Last session end:** 2026-04-19
**State of repo:** clean, all work merged to `master`

---

## Where we are

Three phases complete and shipped:

| Phase | Package | Tag | Tests | Notes |
|---|---|---|---|---|
| P1 | `@clawmart/schema` | `phase-1-schema-complete` | 70 | Zod schemas + types foundation |
| P2 | `@clawmart/build-index` | `phase-2-build-index-complete` | 35 | Registry → CDN artefacts pipeline |
| P3 | `@clawmart/validator` | `phase-3-validator-complete` | 16 | CI auto-gates (schema/dup/file/security) |

Total: **121 tests green**, lint clean, typecheck clean on all three packages.

All three are consumable as workspace packages. `@clawmart/build-index` re-exports `enumerateEntries` which `@clawmart/validator` uses.

## Remaining phases

| # | Phase | Scope |
|---|---|---|
| **P4** | `@clawmart/cli` | `npx clawmart` — init, add, list, info, update, remove, search, doctor, browse. 6 installer per kind. Manifest I/O. Conflict resolution. Registry fetch + cache. **Biggest phase.** |
| P5 | Astro web site | `clawmart.dev` — landing / browse / detail / submit / docs / stats / author pages. Shadcn/ui, Tailwind 4, MeiliSearch InstantSearch + Pagefind fallback. OG images via Satori. |
| P6 | CI/CD | 5 workflows: `validate-pr.yml`, `publish-registry.yml`, `release-cli.yml`, `release-web.yml`, `weekly-health.yml`. Branch protection, CODEOWNERS. Required secrets documented. |
| P7 | Verified tier tooling | `_verified.json` wiring in build-index, `_removed.json` tombstone handling, CODEOWNERS, issue templates, takedown playbook. |
| P8 | Seed content | 50 entries authored: 20 skills + 8 agents + 6 hooks + 5 MCP configs + 5 slash commands + 6 presets. All MIT. All by owner. |
| P9 | Launch readiness | README badges, install GIF, demo video, Plausible analytics, SEO polish, HN / Reddit / Twitter draft copy, newsletter pitches. |

## How to resume

1. Pick the next phase (recommended: P4, the CLI).
2. Write a detailed implementation plan in `docs/superpowers/plans/2026-MM-DD-phase-N-<name>.md` (follow the P1/P2/P3 pattern).
3. Dispatch `plan-document-reviewer` subagent for review. Fold in blockers.
4. Create feature branch `phase-N-<name>`.
5. Execute via `executing-plans` skill, TDD per task, commit per task, merge to `master` at sign-off with a tag.

## Key design references

- Spec: [`docs/superpowers/specs/2026-04-18-clawmart-design.md`](specs/2026-04-18-clawmart-design.md) — §11 tracks phase progress.
- Plan archive: `docs/superpowers/plans/` — P1, P2, P3 plans are useful templates.

## Notes / warnings for next session

- **Biome lint rules** are strict (`noExplicitAny`, `noNonNullAssertion`, `useConst`, `noAssignInExpressions`, `useLiteralKeys`). Auto-format with `pnpm exec biome check --fix --unsafe .` before committing when needed.
- **`noUncheckedIndexedAccess`** is on globally — prefer destructuring defaults over `??`/`!` to satisfy TS without tripping Biome.
- **`exactOptionalPropertyTypes`** is on — do not pass `{ key: undefined }`, omit the key instead.
- **Discriminated unions + `.refine()`** — `.refine()` on a `ZodObject` breaks `z.discriminatedUnion`. Use `superRefine` on the union for cross-field invariants (see `packages/schema/src/entry.ts`).
- **Coverage thresholds** — per-package, tuned to reality. Exclude `src/bin.ts` and sometimes `src/index.ts` (re-export-only) in `vitest.config.ts`.
- **Git log depth in CI** — P6 workflows must use `actions/checkout@v4` with `fetch-depth: 0`, otherwise `build-index` cannot resolve `createdAt` / `updatedAt`.
- **CDN base** is currently hard-coded to `https://cdn.clawmart.dev` in scripts. P6 / P9 should audit before launch.
