# Phase 1: `@clawforge/schema` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `@clawforge/schema` — a Zod-based package that validates every `entry.json` shape in the clawforge registry, exports TypeScript types, and parses namespace IDs (`skill:foo`, `skill:@user/foo`). The package is the dependency foundation for Phases 2–5 (build-index, validator, CLI, web).

**Architecture:** Single `packages/schema/` workspace package. One Zod schema per entry kind (skill, agent, hook, mcp, cmd, preset), composed into a `z.discriminatedUnion` keyed by `kind`. TS types inferred via `z.infer`. Pure library — no I/O, no side effects. Along the way this phase scaffolds the monorepo root (pnpm + Turborepo + Biome + base tsconfig), because P1 is the first package.

**Tech Stack:** TypeScript 5.9, Zod 3.23+, Vitest 2, Biome 1, pnpm 9, Turborepo 2, tsup 8.

**Spec reference:** [2026-04-18-clawforge-design.md](../specs/2026-04-18-clawforge-design.md) §4 (Registry schema).

---

## Prerequisites

- Node.js 20+ (`node -v` must print `v20.x` or higher)
- pnpm 9+ (install: `npm install -g pnpm@9`)
- Git initialised in `H:/60_OSS/clawforge/` (already done — verify with `git log --oneline`)
- Working directory for all commands: `H:/60_OSS/clawforge/`

## File Structure

### Root (monorepo scaffolding — created in tasks 1–3)

| File | Purpose |
|---|---|
| `.gitignore` | Ignore `node_modules`, `dist`, `.turbo`, `coverage` |
| `.nvmrc` | Pin Node 20 |
| `LICENSE` | MIT (owner: @kalkan) |
| `README.md` | Minimal placeholder (replaced at launch) |
| `package.json` | Root, `private: true`, workspace config + root scripts |
| `pnpm-workspace.yaml` | Workspace glob `apps/*`, `packages/*` |
| `turbo.json` | Pipeline config (build, test, lint) |
| `tsconfig.json` | Base tsconfig extended by packages |
| `biome.json` | Format + lint (replaces ESLint + Prettier) |

### `packages/schema/` (the actual phase deliverable)

| File | Responsibility |
|---|---|
| `package.json` | Package manifest, deps, scripts, exports |
| `tsconfig.json` | Extends root, emits declarations |
| `tsup.config.ts` | Bundle to ESM + CJS with types |
| `vitest.config.ts` | Vitest config with coverage |
| `src/index.ts` | Public API re-exports |
| `src/constants.ts` | `KINDS` tuple, recommended category list, regex patterns |
| `src/namespace.ts` | `parseId()`, `formatId()` for `skill:foo` / `skill:@user/foo` |
| `src/common.ts` | `BaseEntry` + `Author` + shared sub-schemas |
| `src/skill.ts` | `SkillEntrySchema` |
| `src/agent.ts` | `AgentEntrySchema` |
| `src/command.ts` | `CommandEntrySchema` |
| `src/hook.ts` | `HookEntrySchema` |
| `src/mcp.ts` | `McpEntrySchema` |
| `src/preset.ts` | `PresetEntrySchema` |
| `src/entry.ts` | `EntrySchema` (discriminated union) + `parseEntry()` |
| `src/registry.ts` | `RegistryIndexSchema`, `IndexEntrySchema`, `RemovedIndexSchema`, `VerifiedIndexSchema` |
| `tests/namespace.test.ts` | Unit tests for namespace parsing |
| `tests/skill.test.ts` | Unit tests per kind schema |
| `tests/agent.test.ts` | |
| `tests/command.test.ts` | |
| `tests/hook.test.ts` | |
| `tests/mcp.test.ts` | |
| `tests/preset.test.ts` | |
| `tests/entry.test.ts` | Discriminated union + error messages |
| `tests/registry.test.ts` | Index schemas |
| `tests/fixtures/` | Golden JSON fixtures (valid + invalid per kind) |

**Invariant:** No file in `src/` imports from `tests/`. No file in `tests/` imports from another test.

---

## Conventions

- **Language:** All code and commit messages in English. Plan prose can be Turkish but the artifacts are English.
- **Commits:** Conventional commits (`feat:`, `test:`, `chore:`, `refactor:`). One commit per task.
- **Tests first (TDD):** Every task writes a failing test, runs it to confirm failure, implements, re-runs to confirm pass, commits.
- **Run tests from repo root** using `pnpm --filter @clawforge/schema test` unless stated otherwise.
- **No `any`, no `as` casts, no `// @ts-ignore`** in `src/`. In tests, casts are allowed only inside fixture builders.
- **File size limit:** ≤ 200 lines per `src/` file; split if exceeded.

---

## Tasks

### Task 1: Scaffold monorepo root configs

**Files:**
- Create: `.gitignore`
- Create: `.nvmrc`
- Create: `LICENSE`
- Create: `README.md`
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `tsconfig.json`

- [ ] **Step 1: Write root `.gitignore`**

```
node_modules/
dist/
.turbo/
coverage/
.tmp/
*.log
.DS_Store
.env
.env.local
```

- [ ] **Step 2: Write `.nvmrc`**

```
20
```

- [ ] **Step 3: Write `LICENSE` (MIT)**

```
MIT License

Copyright (c) 2026 Sabahattin Kalkan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 4: Write minimal `README.md`**

```markdown
# clawforge

The registry for Claude Code — skills, agents, hooks, and MCP servers installable with one command.

> Status: pre-alpha. See [design spec](docs/superpowers/specs/2026-04-18-clawforge-design.md).

License: MIT.
```

- [ ] **Step 5: Write root `package.json`**

```json
{
  "name": "clawforge",
  "private": true,
  "version": "0.0.0",
  "description": "The registry for Claude Code.",
  "license": "MIT",
  "packageManager": "pnpm@9.12.0",
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "biome check .",
    "format": "biome format --write ."
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.0",
    "turbo": "^2.3.0",
    "typescript": "^5.9.0"
  }
}
```

- [ ] **Step 6: Write `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 7: Write `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "lint": {}
  }
}
```

- [ ] **Step 8: Write root `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true
  },
  "exclude": ["node_modules", "dist", "coverage"]
}
```

- [ ] **Step 9: Commit**

```bash
git add .gitignore .nvmrc LICENSE README.md package.json pnpm-workspace.yaml turbo.json tsconfig.json
git commit -m "chore: scaffold monorepo root (pnpm + turborepo + tsconfig)"
```

---

### Task 2: Configure Biome

**Files:**
- Create: `biome.json`

- [ ] **Step 1: Write `biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "files": {
    "ignore": ["dist", "node_modules", ".turbo", "coverage", "*.min.js"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf"
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "noNonNullAssertion": "error",
        "useConst": "error"
      },
      "suspicious": {
        "noExplicitAny": "error"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "trailingCommas": "all",
      "semicolons": "always"
    }
  },
  "organizeImports": {
    "enabled": true
  }
}
```

- [ ] **Step 2: Install root devDependencies**

Run:
```bash
pnpm install
```

Expected: `pnpm` creates `node_modules/` and `pnpm-lock.yaml`. No errors. Exit code 0.

- [ ] **Step 3: Verify Biome runs**

Run:
```bash
pnpm lint
```

Expected: Biome scans the repo and reports no issues (nothing in `src/` yet). Exit code 0.

- [ ] **Step 4: Commit**

```bash
git add biome.json pnpm-lock.yaml
git commit -m "chore: configure Biome for lint and format"
```

---

### Task 3: Scaffold `@clawforge/schema` package

**Files:**
- Create: `packages/schema/package.json`
- Create: `packages/schema/tsconfig.json`
- Create: `packages/schema/tsup.config.ts`
- Create: `packages/schema/vitest.config.ts`
- Create: `packages/schema/src/index.ts` (empty placeholder)

- [ ] **Step 1: Write `packages/schema/package.json`**

```json
{
  "name": "@clawforge/schema",
  "version": "0.0.1",
  "description": "Zod schemas and TypeScript types for clawforge registry entries.",
  "license": "MIT",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsup",
    "test": "vitest run --coverage",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@vitest/coverage-v8": "^2.1.0",
    "tsup": "^8.3.0",
    "typescript": "^5.9.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Write `packages/schema/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

- [ ] **Step 3: Write `packages/schema/tsup.config.ts`**

```ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
});
```

- [ ] **Step 4: Write `packages/schema/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.ts"],
      thresholds: {
        lines: 95,
        statements: 95,
        functions: 95,
        branches: 90,
      },
    },
  },
});
```

- [ ] **Step 5: Write `packages/schema/src/index.ts` (empty placeholder)**

```ts
// Public API re-exports. Filled in as schemas land.
export {};
```

- [ ] **Step 6: Install package deps**

Run:
```bash
pnpm install
```

Expected: pnpm links the workspace package, installs Zod and Vitest. Exit code 0.

- [ ] **Step 7: Verify typecheck passes**

Run:
```bash
pnpm --filter @clawforge/schema typecheck
```

Expected: TypeScript compiles with zero errors. Exit code 0.

- [ ] **Step 8: Commit**

```bash
git add packages/schema/ pnpm-lock.yaml
git commit -m "chore(schema): scaffold @clawforge/schema package"
```

---

### Task 4: Kinds constant + test

**Files:**
- Create: `packages/schema/tests/constants.test.ts`
- Create: `packages/schema/src/constants.ts`

- [ ] **Step 1: Write the failing test**

`packages/schema/tests/constants.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { KINDS, KindSchema } from "../src/constants.js";

describe("KINDS", () => {
  it("contains exactly the six supported kinds", () => {
    expect(KINDS).toEqual(["skill", "agent", "hook", "mcp", "cmd", "preset"]);
  });

  it("is immutable at the type level (readonly tuple)", () => {
    const k: typeof KINDS = ["skill", "agent", "hook", "mcp", "cmd", "preset"];
    expect(k).toHaveLength(6);
  });
});

describe("KindSchema", () => {
  it("accepts every supported kind", () => {
    for (const kind of KINDS) {
      expect(KindSchema.parse(kind)).toBe(kind);
    }
  });

  it("rejects unknown kinds with a helpful error", () => {
    const result = KindSchema.safeParse("plugin");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.code).toBe("invalid_enum_value");
    }
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run:
```bash
pnpm --filter @clawforge/schema test
```

Expected: Fails with `Cannot find module '../src/constants.js'`.

- [ ] **Step 3: Implement `src/constants.ts`**

```ts
import { z } from "zod";

export const KINDS = ["skill", "agent", "hook", "mcp", "cmd", "preset"] as const;
export type Kind = (typeof KINDS)[number];

export const KindSchema = z.enum(KINDS);

export const SLUG_PATTERN = /^[a-z][a-z0-9-]{0,63}$/;
export const USER_HANDLE_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,38}$/;
export const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[a-zA-Z0-9.-]+)?(?:\+[a-zA-Z0-9.-]+)?$/;

export const RECOMMENDED_CATEGORIES = [
  "testing",
  "devops",
  "docs",
  "security",
  "debugging",
  "refactoring",
  "mobile",
  "backend",
  "frontend",
  "data",
  "ai-ml",
  "productivity",
  "other",
] as const;
```

- [ ] **Step 4: Run test — expect PASS**

Run:
```bash
pnpm --filter @clawforge/schema test
```

Expected: All tests in `constants.test.ts` pass.

- [ ] **Step 5: Commit**

```bash
git add packages/schema/src/constants.ts packages/schema/tests/constants.test.ts
git commit -m "feat(schema): add KINDS enum and shared regex patterns"
```

---

### Task 5: Namespace parser (`parseId`, `formatId`)

**Files:**
- Create: `packages/schema/tests/namespace.test.ts`
- Create: `packages/schema/src/namespace.ts`

- [ ] **Step 1: Write the failing test**

`packages/schema/tests/namespace.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatId, parseId } from "../src/namespace.js";

describe("parseId", () => {
  it("parses a global id", () => {
    expect(parseId("skill:tdd-workflow")).toEqual({
      kind: "skill",
      user: null,
      name: "tdd-workflow",
    });
  });

  it("parses a scoped id", () => {
    expect(parseId("skill:@kalkan/custom-tdd")).toEqual({
      kind: "skill",
      user: "kalkan",
      name: "custom-tdd",
    });
  });

  it("throws on missing kind", () => {
    expect(() => parseId(":tdd-workflow")).toThrow(/invalid id/i);
  });

  it("throws on unknown kind", () => {
    expect(() => parseId("plugin:foo")).toThrow(/unknown kind/i);
  });

  it("throws on empty name", () => {
    expect(() => parseId("skill:")).toThrow(/invalid id/i);
  });

  it("throws on malformed scoped id", () => {
    expect(() => parseId("skill:@/foo")).toThrow(/invalid id/i);
    expect(() => parseId("skill:@user")).toThrow(/invalid id/i);
    expect(() => parseId("skill:@user/")).toThrow(/invalid id/i);
  });

  it("throws on name with invalid characters", () => {
    expect(() => parseId("skill:TDD_Workflow")).toThrow(/invalid id/i);
    expect(() => parseId("skill:tdd workflow")).toThrow(/invalid id/i);
  });
});

describe("formatId", () => {
  it("formats a global id", () => {
    expect(formatId({ kind: "skill", user: null, name: "tdd-workflow" })).toBe(
      "skill:tdd-workflow",
    );
  });

  it("formats a scoped id", () => {
    expect(
      formatId({ kind: "agent", user: "kalkan", name: "code-reviewer" }),
    ).toBe("agent:@kalkan/code-reviewer");
  });

  it("round-trips every global id", () => {
    const id = "hook:auto-format-ts";
    expect(formatId(parseId(id))).toBe(id);
  });

  it("round-trips every scoped id", () => {
    const id = "mcp:@anthropic/github-mcp";
    expect(formatId(parseId(id))).toBe(id);
  });

  it("throws on invalid slug in name", () => {
    expect(() =>
      formatId({ kind: "skill", user: null, name: "Bad_Name" }),
    ).toThrow(/invalid name slug/i);
  });

  it("throws on invalid user handle", () => {
    expect(() =>
      formatId({ kind: "skill", user: "bad user", name: "foo" }),
    ).toThrow(/invalid user handle/i);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run:
```bash
pnpm --filter @clawforge/schema test
```

Expected: Fails with `Cannot find module '../src/namespace.js'`.

- [ ] **Step 3: Implement `src/namespace.ts`**

```ts
import { KINDS, type Kind, SLUG_PATTERN, USER_HANDLE_PATTERN } from "./constants.js";

export type ParsedId = {
  kind: Kind;
  user: string | null;
  name: string;
};

const GLOBAL_RE = new RegExp(`^([a-z]+):([a-z][a-z0-9-]{0,63})$`);
const SCOPED_RE = new RegExp(
  `^([a-z]+):@([a-zA-Z0-9][a-zA-Z0-9-]{0,38})/([a-z][a-z0-9-]{0,63})$`,
);

export function parseId(id: string): ParsedId {
  const scoped = SCOPED_RE.exec(id);
  if (scoped) {
    const [, kindRaw, user, name] = scoped;
    assertKind(kindRaw);
    return { kind: kindRaw, user: user ?? null, name: name ?? "" };
  }

  const global = GLOBAL_RE.exec(id);
  if (global) {
    const [, kindRaw, name] = global;
    assertKind(kindRaw);
    return { kind: kindRaw, user: null, name: name ?? "" };
  }

  throw new Error(`invalid id: ${id}`);
}

export function formatId(parsed: ParsedId): string {
  if (!SLUG_PATTERN.test(parsed.name)) {
    throw new Error(`invalid name slug: ${parsed.name}`);
  }
  if (parsed.user !== null) {
    if (!USER_HANDLE_PATTERN.test(parsed.user)) {
      throw new Error(`invalid user handle: ${parsed.user}`);
    }
    return `${parsed.kind}:@${parsed.user}/${parsed.name}`;
  }
  return `${parsed.kind}:${parsed.name}`;
}

function assertKind(value: string | undefined): asserts value is Kind {
  if (value === undefined || !(KINDS as readonly string[]).includes(value)) {
    throw new Error(`unknown kind: ${value}`);
  }
}
```

- [ ] **Step 4: Run test — expect PASS**

Run:
```bash
pnpm --filter @clawforge/schema test
```

Expected: All namespace + constants tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/schema/src/namespace.ts packages/schema/tests/namespace.test.ts
git commit -m "feat(schema): add parseId and formatId for namespace IDs"
```

---

### Task 6: `BaseEntry` and author schemas

**Files:**
- Create: `packages/schema/tests/common.test.ts`
- Create: `packages/schema/src/common.ts`

- [ ] **Step 1: Write the failing test**

`packages/schema/tests/common.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { AuthorSchema, BaseEntrySchema } from "../src/common.js";

const validBase = {
  name: "tdd-workflow",
  displayName: "TDD Workflow",
  description: "Write tests first, enforce red-green-refactor discipline.",
  author: {
    name: "Sabahattin Kalkan",
    github: "kalkan",
  },
  tags: ["testing", "tdd"],
  category: "testing",
  version: "1.2.0",
  license: "MIT",
  verified: false,
  createdAt: "2026-04-18T12:00:00.000Z",
  updatedAt: "2026-04-18T12:00:00.000Z",
  sourceCommit: "a".repeat(40),
  sha256: "b".repeat(64),
};

describe("AuthorSchema", () => {
  it("accepts minimal valid author", () => {
    expect(AuthorSchema.parse({ name: "Ada", github: "ada" })).toEqual({
      name: "Ada",
      github: "ada",
    });
  });

  it("accepts optional url", () => {
    const parsed = AuthorSchema.parse({
      name: "Ada",
      github: "ada",
      url: "https://ada.dev",
    });
    expect(parsed.url).toBe("https://ada.dev");
  });

  it("rejects github handles with @ prefix", () => {
    const result = AuthorSchema.safeParse({ name: "Ada", github: "@ada" });
    expect(result.success).toBe(false);
  });

  it("rejects non-http urls", () => {
    const result = AuthorSchema.safeParse({
      name: "Ada",
      github: "ada",
      url: "javascript:alert(1)",
    });
    expect(result.success).toBe(false);
  });
});

describe("BaseEntrySchema", () => {
  it("accepts a valid entry (no kind — BaseEntry is pre-discriminator)", () => {
    const parsed = BaseEntrySchema.parse(validBase);
    expect(parsed.name).toBe("tdd-workflow");
    expect(parsed.verified).toBe(false);
  });

  it("rejects name with uppercase letters", () => {
    const result = BaseEntrySchema.safeParse({ ...validBase, name: "TDD" });
    expect(result.success).toBe(false);
  });

  it("rejects description over 160 chars", () => {
    const result = BaseEntrySchema.safeParse({
      ...validBase,
      description: "x".repeat(161),
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 5 tags", () => {
    const result = BaseEntrySchema.safeParse({
      ...validBase,
      tags: ["a", "b", "c", "d", "e", "f"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-semver version", () => {
    const result = BaseEntrySchema.safeParse({ ...validBase, version: "1.0" });
    expect(result.success).toBe(false);
  });

  it("rejects non-iso createdAt", () => {
    const result = BaseEntrySchema.safeParse({
      ...validBase,
      createdAt: "2026-04-18",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields (requires, conflicts, repository, sourcePR)", () => {
    const parsed = BaseEntrySchema.parse({
      ...validBase,
      requires: ["skill:tdd-guide"],
      conflicts: ["skill:bdd-workflow"],
      repository: { type: "git", url: "https://github.com/kalkan/tdd" },
      sourcePR: "https://github.com/kalkan/clawforge/pull/1",
      claudeCodeVersion: ">=2.0.0",
    });
    expect(parsed.requires).toEqual(["skill:tdd-guide"]);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run:
```bash
pnpm --filter @clawforge/schema test
```

Expected: Fails with `Cannot find module '../src/common.js'`.

- [ ] **Step 3: Implement `src/common.ts`**

```ts
import { z } from "zod";
import { RECOMMENDED_CATEGORIES, SEMVER_PATTERN, SLUG_PATTERN } from "./constants.js";

export const AuthorSchema = z
  .object({
    name: z.string().min(1).max(100),
    github: z
      .string()
      .regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,38}$/, "invalid github handle"),
    url: z
      .string()
      .url()
      .refine((u) => u.startsWith("https://") || u.startsWith("http://"), {
        message: "url must be http(s)",
      })
      .optional(),
  })
  .strict();

const IsoDateTime = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)) && /T.+Z$/.test(v), {
    message: "must be ISO-8601 datetime with Z suffix",
  });

const Sha256Hex = z.string().regex(/^[a-f0-9]{64}$/, "must be 64-char lowercase hex");
const GitSha = z.string().regex(/^[a-f0-9]{7,40}$/, "must be git SHA");

export const IdReferenceSchema = z
  .string()
  .regex(
    /^(skill|agent|hook|mcp|cmd|preset):(@[a-zA-Z0-9][a-zA-Z0-9-]{0,38}\/)?[a-z][a-z0-9-]{0,63}$/,
    "must be a clawforge id",
  );

export const BaseEntrySchema = z
  .object({
    name: z.string().regex(SLUG_PATTERN, "must be kebab-case slug"),
    displayName: z.string().min(1).max(80),
    description: z.string().min(1).max(160),
    author: AuthorSchema,
    tags: z.array(z.string().regex(SLUG_PATTERN)).max(5),
    category: z.string().min(1),
    version: z.string().regex(SEMVER_PATTERN, "must be valid semver"),
    license: z.string().min(1),
    claudeCodeVersion: z.string().optional(),
    requires: z.array(IdReferenceSchema).optional(),
    conflicts: z.array(IdReferenceSchema).optional(),
    repository: z
      .object({
        type: z.literal("git"),
        url: z.string().url(),
      })
      .strict()
      .optional(),
    verified: z.boolean(),
    createdAt: IsoDateTime,
    updatedAt: IsoDateTime,
    sourceCommit: GitSha,
    sourcePR: z.string().url().optional(),
    sha256: Sha256Hex,
  })
  .strict();

export type Author = z.infer<typeof AuthorSchema>;
export type BaseEntry = z.infer<typeof BaseEntrySchema>;

export const RECOMMENDED_CATEGORY_SET: ReadonlySet<string> = new Set(
  RECOMMENDED_CATEGORIES,
);
```

- [ ] **Step 4: Run test — expect PASS**

Run:
```bash
pnpm --filter @clawforge/schema test
```

Expected: All `common.test.ts` cases pass. Existing tests still pass.

- [ ] **Step 5: Commit**

```bash
git add packages/schema/src/common.ts packages/schema/tests/common.test.ts
git commit -m "feat(schema): add BaseEntry and Author schemas"
```

---

### Task 7: Fixture helpers

**Files:**
- Create: `packages/schema/tests/fixtures/index.ts`

- [ ] **Step 1: Write fixture helpers**

`packages/schema/tests/fixtures/index.ts`:

```ts
import type { BaseEntry } from "../../src/common.js";

export const BASE_FIXTURE: BaseEntry = {
  name: "tdd-workflow",
  displayName: "TDD Workflow",
  description: "Write tests first, enforce red-green-refactor discipline.",
  author: { name: "Sabahattin Kalkan", github: "kalkan" },
  tags: ["testing", "tdd"],
  category: "testing",
  version: "1.2.0",
  license: "MIT",
  verified: false,
  createdAt: "2026-04-18T12:00:00.000Z",
  updatedAt: "2026-04-18T12:00:00.000Z",
  sourceCommit: "a".repeat(40),
  sha256: "b".repeat(64),
};

export function base(overrides: Partial<BaseEntry> = {}): BaseEntry {
  return { ...BASE_FIXTURE, ...overrides };
}
```

- [ ] **Step 2: Commit**

This file has no test of its own; it is consumed by upcoming tests.

```bash
git add packages/schema/tests/fixtures/index.ts
git commit -m "test(schema): add base fixture helpers"
```

---

### Task 8: `SkillEntrySchema`

**Files:**
- Create: `packages/schema/tests/skill.test.ts`
- Create: `packages/schema/src/skill.ts`

- [ ] **Step 1: Write the failing test**

`packages/schema/tests/skill.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { SkillEntrySchema } from "../src/skill.js";
import { base } from "./fixtures/index.js";

describe("SkillEntrySchema", () => {
  it("accepts a minimal skill entry", () => {
    const parsed = SkillEntrySchema.parse({
      ...base(),
      kind: "skill",
      files: [
        { source: "skill.md", target: "{{CLAUDE_DIR}}/skills/{{name}}/SKILL.md" },
      ],
    });
    expect(parsed.kind).toBe("skill");
    expect(parsed.files).toHaveLength(1);
  });

  it("accepts optional activatesOn keywords", () => {
    const parsed = SkillEntrySchema.parse({
      ...base(),
      kind: "skill",
      files: [{ source: "skill.md", target: "{{CLAUDE_DIR}}/skills/{{name}}/SKILL.md" }],
      activatesOn: ["tdd", "testing"],
    });
    expect(parsed.activatesOn).toEqual(["tdd", "testing"]);
  });

  it("rejects wrong kind discriminator", () => {
    const result = SkillEntrySchema.safeParse({
      ...base(),
      kind: "agent",
      files: [{ source: "x.md", target: "{{CLAUDE_DIR}}/skills/{{name}}/SKILL.md" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty files array", () => {
    const result = SkillEntrySchema.safeParse({ ...base(), kind: "skill", files: [] });
    expect(result.success).toBe(false);
  });

  it("rejects unknown template tokens in target", () => {
    const result = SkillEntrySchema.safeParse({
      ...base(),
      kind: "skill",
      files: [{ source: "skill.md", target: "{{HOME}}/skills/foo/SKILL.md" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects absolute paths without supported tokens", () => {
    const result = SkillEntrySchema.safeParse({
      ...base(),
      kind: "skill",
      files: [{ source: "skill.md", target: "/etc/passwd" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects sources escaping the entry directory", () => {
    const result = SkillEntrySchema.safeParse({
      ...base(),
      kind: "skill",
      files: [{ source: "../evil.md", target: "{{CLAUDE_DIR}}/skills/{{name}}/SKILL.md" }],
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run:
```bash
pnpm --filter @clawforge/schema test
```

Expected: Fails with `Cannot find module '../src/skill.js'`.

- [ ] **Step 3: Implement `src/skill.ts`**

```ts
import { z } from "zod";
import { BaseEntrySchema } from "./common.js";
import { SLUG_PATTERN } from "./constants.js";

const TEMPLATE_TOKEN_RE = /\{\{([A-Z_]+|name)\}\}/g;
const ALLOWED_TOKENS = new Set(["CLAUDE_DIR", "name"]);

const FileTargetSchema = z
  .string()
  .min(1)
  .refine((v) => !v.includes(".."), { message: "target must not contain .." })
  .refine(
    (v) => {
      const matches = [...v.matchAll(TEMPLATE_TOKEN_RE)].map((m) => m[1]);
      if (matches.length === 0) return false;
      return matches.every((t) => t !== undefined && ALLOWED_TOKENS.has(t));
    },
    {
      message: "target must use only {{CLAUDE_DIR}} and {{name}} tokens",
    },
  );

const FileSourceSchema = z
  .string()
  .min(1)
  .refine((v) => !v.startsWith("/") && !v.includes("..") && !v.includes("\\"), {
    message: "source must be relative path without '..' or backslashes",
  });

export const FileMappingSchema = z
  .object({
    source: FileSourceSchema,
    target: FileTargetSchema,
  })
  .strict();

export const SkillEntrySchema = BaseEntrySchema.extend({
  kind: z.literal("skill"),
  files: z.array(FileMappingSchema).min(1),
  activatesOn: z.array(z.string().regex(SLUG_PATTERN)).max(10).optional(),
}).strict();

export type SkillEntry = z.infer<typeof SkillEntrySchema>;
```

- [ ] **Step 4: Run test — expect PASS**

Run:
```bash
pnpm --filter @clawforge/schema test
```

Expected: All skill tests pass. Existing tests still pass.

- [ ] **Step 5: Commit**

```bash
git add packages/schema/src/skill.ts packages/schema/tests/skill.test.ts
git commit -m "feat(schema): add SkillEntrySchema with path-template safety checks"
```

---

### Task 9: `AgentEntrySchema`

**Files:**
- Create: `packages/schema/tests/agent.test.ts`
- Create: `packages/schema/src/agent.ts`

- [ ] **Step 1: Write the failing test**

`packages/schema/tests/agent.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { AgentEntrySchema } from "../src/agent.js";
import { base } from "./fixtures/index.js";

describe("AgentEntrySchema", () => {
  const validAgent = {
    ...base(),
    kind: "agent" as const,
    files: [{ source: "agent.md", target: "{{CLAUDE_DIR}}/agents/{{name}}.md" }],
  };

  it("accepts a minimal agent entry", () => {
    const parsed = AgentEntrySchema.parse(validAgent);
    expect(parsed.kind).toBe("agent");
  });

  it("accepts tools and model", () => {
    const parsed = AgentEntrySchema.parse({
      ...validAgent,
      tools: ["Read", "Edit", "Bash"],
      model: "sonnet",
    });
    expect(parsed.tools).toEqual(["Read", "Edit", "Bash"]);
    expect(parsed.model).toBe("sonnet");
  });

  it("rejects unknown model", () => {
    const result = AgentEntrySchema.safeParse({ ...validAgent, model: "gpt-4" });
    expect(result.success).toBe(false);
  });

  it("rejects empty tools array", () => {
    const result = AgentEntrySchema.safeParse({ ...validAgent, tools: [] });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run:
```bash
pnpm --filter @clawforge/schema test
```

Expected: `Cannot find module '../src/agent.js'`.

- [ ] **Step 3: Implement `src/agent.ts`**

```ts
import { z } from "zod";
import { BaseEntrySchema } from "./common.js";
import { FileMappingSchema } from "./skill.js";

export const AgentEntrySchema = BaseEntrySchema.extend({
  kind: z.literal("agent"),
  files: z.array(FileMappingSchema).min(1),
  tools: z.array(z.string().min(1)).min(1).optional(),
  model: z.enum(["sonnet", "opus", "haiku"]).optional(),
}).strict();

export type AgentEntry = z.infer<typeof AgentEntrySchema>;
```

- [ ] **Step 4: Run test — expect PASS**

Run:
```bash
pnpm --filter @clawforge/schema test
```

Expected: All agent tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/schema/src/agent.ts packages/schema/tests/agent.test.ts
git commit -m "feat(schema): add AgentEntrySchema"
```

---

### Task 10: `CommandEntrySchema`

**Files:**
- Create: `packages/schema/tests/command.test.ts`
- Create: `packages/schema/src/command.ts`

- [ ] **Step 1: Write the failing test**

`packages/schema/tests/command.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { CommandEntrySchema } from "../src/command.js";
import { base } from "./fixtures/index.js";

describe("CommandEntrySchema", () => {
  const validCmd = {
    ...base(),
    kind: "cmd" as const,
    files: [{ source: "command.md", target: "{{CLAUDE_DIR}}/commands/{{name}}.md" }],
    invocation: "/code-review",
  };

  it("accepts a valid command entry", () => {
    const parsed = CommandEntrySchema.parse(validCmd);
    expect(parsed.invocation).toBe("/code-review");
  });

  it("rejects invocation without leading slash", () => {
    const result = CommandEntrySchema.safeParse({ ...validCmd, invocation: "code-review" });
    expect(result.success).toBe(false);
  });

  it("rejects invocation with spaces", () => {
    const result = CommandEntrySchema.safeParse({ ...validCmd, invocation: "/code review" });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run:
```bash
pnpm --filter @clawforge/schema test
```

Expected: `Cannot find module '../src/command.js'`.

- [ ] **Step 3: Implement `src/command.ts`**

```ts
import { z } from "zod";
import { BaseEntrySchema } from "./common.js";
import { FileMappingSchema } from "./skill.js";

export const CommandEntrySchema = BaseEntrySchema.extend({
  kind: z.literal("cmd"),
  files: z.array(FileMappingSchema).min(1),
  invocation: z
    .string()
    .regex(/^\/[a-z][a-z0-9-]{0,63}$/, "must start with '/' and be kebab-case"),
}).strict();

export type CommandEntry = z.infer<typeof CommandEntrySchema>;
```

- [ ] **Step 4: Run test — expect PASS**

Run:
```bash
pnpm --filter @clawforge/schema test
```

Expected: All command tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/schema/src/command.ts packages/schema/tests/command.test.ts
git commit -m "feat(schema): add CommandEntrySchema"
```

---

### Task 11: `HookEntrySchema`

**Files:**
- Create: `packages/schema/tests/hook.test.ts`
- Create: `packages/schema/src/hook.ts`

- [ ] **Step 1: Write the failing test**

`packages/schema/tests/hook.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { HookEntrySchema } from "../src/hook.js";
import { base } from "./fixtures/index.js";

describe("HookEntrySchema", () => {
  const validHook = {
    ...base(),
    kind: "hook" as const,
    snippetFile: "hook.json",
    mergeTarget: "settings.json" as const,
    mergePath: "hooks.PostToolUse",
    strategy: "append" as const,
  };

  it("accepts a valid hook entry", () => {
    const parsed = HookEntrySchema.parse(validHook);
    expect(parsed.strategy).toBe("append");
  });

  it("rejects unknown mergeTarget", () => {
    const result = HookEntrySchema.safeParse({
      ...validHook,
      mergeTarget: "other.json",
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown strategy", () => {
    const result = HookEntrySchema.safeParse({ ...validHook, strategy: "overwrite" });
    expect(result.success).toBe(false);
  });

  it("rejects mergePath with dangerous keys", () => {
    const result = HookEntrySchema.safeParse({
      ...validHook,
      mergePath: "hooks.PostToolUse..",
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run:
```bash
pnpm --filter @clawforge/schema test
```

- [ ] **Step 3: Implement `src/hook.ts`**

```ts
import { z } from "zod";
import { BaseEntrySchema } from "./common.js";

const SnippetFileSchema = z
  .string()
  .min(1)
  .refine((v) => !v.startsWith("/") && !v.includes("..") && !v.includes("\\"), {
    message: "snippetFile must be a relative path without '..' or backslashes",
  });

const MergePathSchema = z
  .string()
  .min(1)
  .regex(/^[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*)*$/, {
    message: "mergePath must be dot-separated identifiers",
  });

export const HookEntrySchema = BaseEntrySchema.extend({
  kind: z.literal("hook"),
  snippetFile: SnippetFileSchema,
  mergeTarget: z.literal("settings.json"),
  mergePath: MergePathSchema,
  strategy: z.enum(["append", "replace"]),
}).strict();

export type HookEntry = z.infer<typeof HookEntrySchema>;
```

- [ ] **Step 4: Run test — expect PASS**

Run:
```bash
pnpm --filter @clawforge/schema test
```

- [ ] **Step 5: Commit**

```bash
git add packages/schema/src/hook.ts packages/schema/tests/hook.test.ts
git commit -m "feat(schema): add HookEntrySchema with merge-path safety check"
```

---

### Task 12: `McpEntrySchema`

**Files:**
- Create: `packages/schema/tests/mcp.test.ts`
- Create: `packages/schema/src/mcp.ts`

- [ ] **Step 1: Write the failing test**

`packages/schema/tests/mcp.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { McpEntrySchema } from "../src/mcp.js";
import { base } from "./fixtures/index.js";

describe("McpEntrySchema", () => {
  const validMcp = {
    ...base(),
    kind: "mcp" as const,
    snippetFile: "mcp.json",
    mergeTarget: "settings.json" as const,
    mergePath: "mcpServers.{{name}}",
  };

  it("accepts a valid mcp entry", () => {
    const parsed = McpEntrySchema.parse(validMcp);
    expect(parsed.mergePath).toBe("mcpServers.{{name}}");
  });

  it("accepts envVars metadata", () => {
    const parsed = McpEntrySchema.parse({
      ...validMcp,
      envVars: [
        { name: "GITHUB_TOKEN", required: true, description: "GitHub API token" },
      ],
    });
    expect(parsed.envVars?.[0]?.name).toBe("GITHUB_TOKEN");
  });

  it("rejects envVars with empty description", () => {
    const result = McpEntrySchema.safeParse({
      ...validMcp,
      envVars: [{ name: "X", required: true, description: "" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects envVars with lowercase name", () => {
    const result = McpEntrySchema.safeParse({
      ...validMcp,
      envVars: [{ name: "github_token", required: true, description: "x" }],
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run:
```bash
pnpm --filter @clawforge/schema test
```

- [ ] **Step 3: Implement `src/mcp.ts`**

```ts
import { z } from "zod";
import { BaseEntrySchema } from "./common.js";

const SnippetFileSchema = z
  .string()
  .min(1)
  .refine((v) => !v.startsWith("/") && !v.includes("..") && !v.includes("\\"), {
    message: "snippetFile must be a relative path without '..' or backslashes",
  });

const MergePathSchema = z
  .string()
  .min(1)
  .regex(
    /^[a-zA-Z_$][a-zA-Z0-9_$]*(\.([a-zA-Z_$][a-zA-Z0-9_$]*|\{\{name\}\}))*$/,
    { message: "mergePath must be dot-separated identifiers or {{name}} token" },
  );

const EnvVarSchema = z
  .object({
    name: z.string().regex(/^[A-Z][A-Z0-9_]*$/, "env name must be SCREAMING_SNAKE_CASE"),
    required: z.boolean(),
    description: z.string().min(1).max(200),
  })
  .strict();

export const McpEntrySchema = BaseEntrySchema.extend({
  kind: z.literal("mcp"),
  snippetFile: SnippetFileSchema,
  mergeTarget: z.literal("settings.json"),
  mergePath: MergePathSchema,
  envVars: z.array(EnvVarSchema).optional(),
}).strict();

export type McpEntry = z.infer<typeof McpEntrySchema>;
```

- [ ] **Step 4: Run test — expect PASS**

Run:
```bash
pnpm --filter @clawforge/schema test
```

- [ ] **Step 5: Commit**

```bash
git add packages/schema/src/mcp.ts packages/schema/tests/mcp.test.ts
git commit -m "feat(schema): add McpEntrySchema with env var metadata"
```

---

### Task 13: `PresetEntrySchema`

**Files:**
- Create: `packages/schema/tests/preset.test.ts`
- Create: `packages/schema/src/preset.ts`

- [ ] **Step 1: Write the failing test**

`packages/schema/tests/preset.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { PresetEntrySchema } from "../src/preset.js";
import { base } from "./fixtures/index.js";

describe("PresetEntrySchema", () => {
  const validPreset = {
    ...base(),
    name: "strict-tdd",
    kind: "preset" as const,
    includes: ["skill:tdd-workflow", "agent:code-reviewer"],
  };

  it("accepts a valid preset", () => {
    const parsed = PresetEntrySchema.parse(validPreset);
    expect(parsed.includes).toHaveLength(2);
  });

  it("accepts optional settingsPatch filename", () => {
    const parsed = PresetEntrySchema.parse({
      ...validPreset,
      settingsPatch: "preset.json",
    });
    expect(parsed.settingsPatch).toBe("preset.json");
  });

  it("rejects empty includes", () => {
    const result = PresetEntrySchema.safeParse({ ...validPreset, includes: [] });
    expect(result.success).toBe(false);
  });

  it("rejects includes with malformed ids", () => {
    const result = PresetEntrySchema.safeParse({
      ...validPreset,
      includes: ["skill:Bad_Name"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate ids in includes", () => {
    const result = PresetEntrySchema.safeParse({
      ...validPreset,
      includes: ["skill:tdd-workflow", "skill:tdd-workflow"],
    });
    expect(result.success).toBe(false);
  });

  // Note: the "preset including itself" check is enforced at the union level
  // (`EntrySchema` in src/entry.ts) via `superRefine`, not here. Keeping
  // `PresetEntrySchema` as a pure `ZodObject` is required by `z.discriminatedUnion`.
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run:
```bash
pnpm --filter @clawforge/schema test
```

- [ ] **Step 3: Implement `src/preset.ts`**

```ts
import { z } from "zod";
import { BaseEntrySchema, IdReferenceSchema } from "./common.js";

const SnippetFileSchema = z
  .string()
  .min(1)
  .refine((v) => !v.startsWith("/") && !v.includes("..") && !v.includes("\\"), {
    message: "settingsPatch must be a relative path without '..' or backslashes",
  });

// Must remain a pure ZodObject (no top-level `.refine()`) so `z.discriminatedUnion`
// in src/entry.ts will accept it. The "preset cannot include itself" invariant
// is enforced at the union level via `superRefine`.
export const PresetEntrySchema = BaseEntrySchema.extend({
  kind: z.literal("preset"),
  includes: z
    .array(IdReferenceSchema)
    .min(1)
    .refine((arr) => new Set(arr).size === arr.length, {
      message: "includes must not contain duplicates",
    }),
  settingsPatch: SnippetFileSchema.optional(),
}).strict();

export type PresetEntry = z.infer<typeof PresetEntrySchema>;
```

- [ ] **Step 4: Run test — expect PASS**

Run:
```bash
pnpm --filter @clawforge/schema test
```

- [ ] **Step 5: Commit**

```bash
git add packages/schema/src/preset.ts packages/schema/tests/preset.test.ts
git commit -m "feat(schema): add PresetEntrySchema with duplicate-includes guard"
```

---

### Task 14: Discriminated `EntrySchema` + `parseEntry`

**Files:**
- Create: `packages/schema/tests/entry.test.ts`
- Create: `packages/schema/src/entry.ts`

- [ ] **Step 1: Write the failing test**

`packages/schema/tests/entry.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { EntrySchema, parseEntry } from "../src/entry.js";
import { base } from "./fixtures/index.js";

describe("EntrySchema (discriminated union)", () => {
  it("parses a skill entry", () => {
    const parsed = EntrySchema.parse({
      ...base(),
      kind: "skill",
      files: [{ source: "skill.md", target: "{{CLAUDE_DIR}}/skills/{{name}}/SKILL.md" }],
    });
    expect(parsed.kind).toBe("skill");
  });

  it("parses a preset entry", () => {
    const parsed = EntrySchema.parse({
      ...base(),
      name: "strict-tdd",
      kind: "preset",
      includes: ["skill:tdd-workflow"],
    });
    expect(parsed.kind).toBe("preset");
  });

  it("rejects entries without a kind discriminator", () => {
    const result = EntrySchema.safeParse({ ...base() });
    expect(result.success).toBe(false);
  });

  it("rejects a preset that includes itself (union-level superRefine)", () => {
    const result = EntrySchema.safeParse({
      ...base(),
      name: "strict-tdd",
      kind: "preset",
      includes: ["preset:strict-tdd"],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("includes"))).toBe(true);
    }
  });
});

describe("parseEntry", () => {
  it("returns the parsed entry on success", () => {
    const entry = parseEntry({
      ...base(),
      kind: "agent",
      files: [{ source: "agent.md", target: "{{CLAUDE_DIR}}/agents/{{name}}.md" }],
    });
    expect(entry.kind).toBe("agent");
  });

  it("throws a formatted error listing every issue", () => {
    try {
      parseEntry({ ...base(), kind: "skill" });
      throw new Error("should have thrown");
    } catch (err) {
      const message = (err as Error).message;
      expect(message).toMatch(/files/);
      expect(message).toMatch(/entry validation failed/i);
    }
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run:
```bash
pnpm --filter @clawforge/schema test
```

- [ ] **Step 3: Implement `src/entry.ts`**

```ts
import { z } from "zod";
import { AgentEntrySchema } from "./agent.js";
import { CommandEntrySchema } from "./command.js";
import { HookEntrySchema } from "./hook.js";
import { McpEntrySchema } from "./mcp.js";
import { PresetEntrySchema } from "./preset.js";
import { SkillEntrySchema } from "./skill.js";

// `discriminatedUnion` accepts only `ZodObject` options. Cross-field invariants
// that span kinds (e.g. "preset cannot include itself") are applied afterwards
// via `superRefine`, which wraps the union in `ZodEffects`. Consumers should
// use `EntrySchema` for parsing; the individual `*EntrySchema` exports remain
// `ZodObject` so they can compose into the union or be reused elsewhere.
const EntryUnion = z.discriminatedUnion("kind", [
  SkillEntrySchema,
  AgentEntrySchema,
  CommandEntrySchema,
  HookEntrySchema,
  McpEntrySchema,
  PresetEntrySchema,
]);

export const EntrySchema = EntryUnion.superRefine((entry, ctx) => {
  if (entry.kind === "preset" && entry.includes.includes(`preset:${entry.name}`)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "preset cannot include itself",
      path: ["includes"],
    });
  }
});

export type Entry = z.infer<typeof EntryUnion>;

export function parseEntry(input: unknown): Entry {
  const result = EntrySchema.safeParse(input);
  if (result.success) return result.data;
  const lines = result.error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "<root>";
    return `  - ${path}: ${issue.message}`;
  });
  throw new Error(`entry validation failed:\n${lines.join("\n")}`);
}
```

- [ ] **Step 4: Run test — expect PASS**

Run:
```bash
pnpm --filter @clawforge/schema test
```

- [ ] **Step 5: Commit**

```bash
git add packages/schema/src/entry.ts packages/schema/tests/entry.test.ts
git commit -m "feat(schema): add EntrySchema discriminated union and parseEntry helper"
```

---

### Task 15: Registry index schemas

**Files:**
- Create: `packages/schema/tests/registry.test.ts`
- Create: `packages/schema/src/registry.ts`

- [ ] **Step 1: Write the failing test**

`packages/schema/tests/registry.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  IndexEntrySchema,
  RegistryIndexSchema,
  RemovedIndexSchema,
  VerifiedIndexSchema,
} from "../src/registry.js";

const validIndexEntry = {
  id: "skill:tdd-workflow",
  kind: "skill",
  name: "tdd-workflow",
  displayName: "TDD Workflow",
  description: "Write tests first.",
  tags: ["testing"],
  category: "testing",
  verified: true,
  version: "1.2.0",
  author: "kalkan",
  detailUrl: "https://cdn.clawforge.dev/skills/tdd-workflow/entry.json",
  sha256: "a".repeat(64),
  updatedAt: "2026-04-18T12:00:00.000Z",
};

describe("IndexEntrySchema", () => {
  it("accepts a valid lightweight index entry", () => {
    const parsed = IndexEntrySchema.parse(validIndexEntry);
    expect(parsed.id).toBe("skill:tdd-workflow");
  });

  it("rejects id not matching kind", () => {
    const result = IndexEntrySchema.safeParse({ ...validIndexEntry, kind: "agent" });
    expect(result.success).toBe(false);
  });
});

describe("RegistryIndexSchema", () => {
  it("accepts an empty registry", () => {
    const parsed = RegistryIndexSchema.parse({
      version: 1,
      generatedAt: "2026-04-18T12:00:00.000Z",
      count: 0,
      entries: [],
    });
    expect(parsed.count).toBe(0);
  });

  it("rejects count mismatch vs entries length", () => {
    const result = RegistryIndexSchema.safeParse({
      version: 1,
      generatedAt: "2026-04-18T12:00:00.000Z",
      count: 2,
      entries: [validIndexEntry],
    });
    expect(result.success).toBe(false);
  });
});

describe("VerifiedIndexSchema", () => {
  it("accepts a valid verified index", () => {
    const parsed = VerifiedIndexSchema.parse({
      version: 1,
      entries: {
        "skill:tdd-workflow": {
          verifiedAt: "2026-04-15T12:00:00.000Z",
          verifiedBy: "kalkan",
          verifiedVersion: "1.2.0",
          reason: "High-quality, well-documented.",
          expiresAt: null,
        },
      },
    });
    expect(parsed.entries["skill:tdd-workflow"]?.verifiedBy).toBe("kalkan");
  });

  it("allows null expiresAt", () => {
    const parsed = VerifiedIndexSchema.parse({
      version: 1,
      entries: {},
    });
    expect(Object.keys(parsed.entries)).toHaveLength(0);
  });
});

describe("RemovedIndexSchema", () => {
  it("accepts a removed entry record", () => {
    const parsed = RemovedIndexSchema.parse({
      version: 1,
      entries: {
        "skill:evil-thing": {
          removedAt: "2026-04-18T12:00:00.000Z",
          reason: "malicious",
          category: "security",
        },
      },
    });
    expect(parsed.entries["skill:evil-thing"]?.category).toBe("security");
  });

  it("rejects unknown category", () => {
    const result = RemovedIndexSchema.safeParse({
      version: 1,
      entries: {
        "skill:x": { removedAt: "2026-04-18T12:00:00.000Z", reason: "x", category: "other" },
      },
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run:
```bash
pnpm --filter @clawforge/schema test
```

- [ ] **Step 3: Implement `src/registry.ts`**

```ts
import { z } from "zod";
import { IdReferenceSchema } from "./common.js";
import { KindSchema, SLUG_PATTERN, SEMVER_PATTERN } from "./constants.js";

const IsoDateTime = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)) && /T.+Z$/.test(v), {
    message: "must be ISO-8601 datetime with Z suffix",
  });

const Sha256Hex = z.string().regex(/^[a-f0-9]{64}$/);

export const IndexEntrySchema = z
  .object({
    id: IdReferenceSchema,
    kind: KindSchema,
    name: z.string().regex(SLUG_PATTERN),
    displayName: z.string().min(1),
    description: z.string().max(160),
    tags: z.array(z.string().regex(SLUG_PATTERN)).max(5),
    category: z.string().min(1),
    verified: z.boolean(),
    version: z.string().regex(SEMVER_PATTERN),
    author: z.string().min(1),
    detailUrl: z.string().url(),
    sha256: Sha256Hex,
    updatedAt: IsoDateTime,
  })
  .strict()
  .refine((e) => e.id === `${e.kind}:${e.name}` || e.id.startsWith(`${e.kind}:@`), {
    message: "id must match kind and name",
  });

export type IndexEntry = z.infer<typeof IndexEntrySchema>;

export const RegistryIndexSchema = z
  .object({
    version: z.literal(1),
    generatedAt: IsoDateTime,
    count: z.number().int().nonnegative(),
    entries: z.array(IndexEntrySchema),
  })
  .strict()
  .refine((r) => r.count === r.entries.length, {
    message: "count must equal entries.length",
  });

export type RegistryIndex = z.infer<typeof RegistryIndexSchema>;

export const VerifiedIndexSchema = z
  .object({
    version: z.literal(1),
    entries: z.record(
      IdReferenceSchema,
      z
        .object({
          verifiedAt: IsoDateTime,
          verifiedBy: z.string().min(1),
          verifiedVersion: z.string().regex(SEMVER_PATTERN),
          reason: z.string().min(1).max(500),
          expiresAt: IsoDateTime.nullable(),
        })
        .strict(),
    ),
  })
  .strict();

export type VerifiedIndex = z.infer<typeof VerifiedIndexSchema>;

export const RemovedIndexSchema = z
  .object({
    version: z.literal(1),
    entries: z.record(
      IdReferenceSchema,
      z
        .object({
          removedAt: IsoDateTime,
          reason: z.string().min(1).max(500),
          category: z.enum(["malicious", "broken", "ip-violation", "author-request", "security"]),
        })
        .strict(),
    ),
  })
  .strict();

export type RemovedIndex = z.infer<typeof RemovedIndexSchema>;
```

- [ ] **Step 4: Run test — expect PASS**

Run:
```bash
pnpm --filter @clawforge/schema test
```

- [ ] **Step 5: Commit**

```bash
git add packages/schema/src/registry.ts packages/schema/tests/registry.test.ts
git commit -m "feat(schema): add registry index, verified, and removed schemas"
```

---

### Task 16: Public API (`src/index.ts`)

**Files:**
- Modify: `packages/schema/src/index.ts`
- Create: `packages/schema/tests/index.test.ts`

- [ ] **Step 1: Write the failing test**

`packages/schema/tests/index.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import * as api from "../src/index.js";

describe("public API", () => {
  it("exports every schema", () => {
    const required = [
      "KINDS",
      "KindSchema",
      "AuthorSchema",
      "BaseEntrySchema",
      "IdReferenceSchema",
      "SkillEntrySchema",
      "AgentEntrySchema",
      "CommandEntrySchema",
      "HookEntrySchema",
      "McpEntrySchema",
      "PresetEntrySchema",
      "EntrySchema",
      "parseEntry",
      "parseId",
      "formatId",
      "IndexEntrySchema",
      "RegistryIndexSchema",
      "VerifiedIndexSchema",
      "RemovedIndexSchema",
      "RECOMMENDED_CATEGORIES",
    ];
    for (const name of required) {
      expect(api).toHaveProperty(name);
    }
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

Run:
```bash
pnpm --filter @clawforge/schema test
```

- [ ] **Step 3: Implement `src/index.ts`**

Replace entire content:

```ts
export {
  KINDS,
  KindSchema,
  RECOMMENDED_CATEGORIES,
  SEMVER_PATTERN,
  SLUG_PATTERN,
  USER_HANDLE_PATTERN,
  type Kind,
} from "./constants.js";

export { parseId, formatId, type ParsedId } from "./namespace.js";

export {
  AuthorSchema,
  BaseEntrySchema,
  IdReferenceSchema,
  RECOMMENDED_CATEGORY_SET,
  type Author,
  type BaseEntry,
} from "./common.js";

export { FileMappingSchema, SkillEntrySchema, type SkillEntry } from "./skill.js";
export { AgentEntrySchema, type AgentEntry } from "./agent.js";
export { CommandEntrySchema, type CommandEntry } from "./command.js";
export { HookEntrySchema, type HookEntry } from "./hook.js";
export { McpEntrySchema, type McpEntry } from "./mcp.js";
export { PresetEntrySchema, type PresetEntry } from "./preset.js";
export { EntrySchema, parseEntry, type Entry } from "./entry.js";
export {
  IndexEntrySchema,
  RegistryIndexSchema,
  VerifiedIndexSchema,
  RemovedIndexSchema,
  type IndexEntry,
  type RegistryIndex,
  type VerifiedIndex,
  type RemovedIndex,
} from "./registry.js";
```

- [ ] **Step 4: Run test — expect PASS**

Run:
```bash
pnpm --filter @clawforge/schema test
```

- [ ] **Step 5: Commit**

```bash
git add packages/schema/src/index.ts packages/schema/tests/index.test.ts
git commit -m "feat(schema): wire public API exports"
```

---

### Task 17: Build + coverage verification

**Files:** (none — verification task)

- [ ] **Step 1: Run typecheck**

Run:
```bash
pnpm --filter @clawforge/schema typecheck
```

Expected: exit code 0, zero errors.

- [ ] **Step 2: Run full test suite with coverage**

Run:
```bash
pnpm --filter @clawforge/schema test
```

Expected: all tests pass, coverage ≥ 95 % on lines/statements/functions and ≥ 90 % on branches. If a threshold fails, add missing tests in a new commit before proceeding.

- [ ] **Step 3: Build the package**

Run:
```bash
pnpm --filter @clawforge/schema build
```

Expected: `packages/schema/dist/` contains `index.js`, `index.cjs`, `index.d.ts`, and sourcemaps. No build errors.

- [ ] **Step 4: Smoke-test the built output**

Create `.tmp/smoke.mjs` inside the repo (the `.tmp/` directory is already `.gitignore`-ed via `*.log` / build artefacts — add `.tmp/` to `.gitignore` if it isn't covered):

```js
import { parseEntry, formatId } from "../packages/schema/dist/index.js";

const entry = parseEntry({
  name: "smoke",
  kind: "skill",
  displayName: "Smoke",
  description: "x",
  author: { name: "A", github: "a" },
  tags: [],
  category: "other",
  version: "0.0.1",
  license: "MIT",
  verified: false,
  createdAt: "2026-04-18T00:00:00.000Z",
  updatedAt: "2026-04-18T00:00:00.000Z",
  sourceCommit: "a".repeat(40),
  sha256: "b".repeat(64),
  files: [{ source: "smoke.md", target: "{{CLAUDE_DIR}}/skills/{{name}}/SKILL.md" }],
});

console.log(entry.kind, formatId({ kind: "skill", user: null, name: "smoke" }));
```

Commands (run from `H:/60_OSS/clawforge/`):

```bash
mkdir -p .tmp
# Paste the JS above into .tmp/smoke.mjs with your editor, or:
# (use the repo's preferred method — do NOT place it outside the repo)
node .tmp/smoke.mjs
```

Expected output:
```
skill skill:smoke
```

Cleanup:
```bash
rm -rf .tmp
```

`.tmp/` is already listed in `.gitignore` from Task 1, so nothing should be staged by accident.

- [ ] **Step 5: Run Biome across the repo**

Run:
```bash
pnpm lint
```

Expected: zero errors. If warnings appear, fix them before proceeding (they usually point at missing `as const` or unused imports).

- [ ] **Step 6: Commit verification artifacts (none expected)**

If Step 2 required adding tests to hit coverage, commit that change:

```bash
git add packages/schema/tests
git commit -m "test(schema): cover remaining branches for coverage thresholds"
```

Otherwise move on.

---

### Task 18: Package README

**Files:**
- Create: `packages/schema/README.md`

- [ ] **Step 1: Write `packages/schema/README.md`**

```markdown
# @clawforge/schema

Zod schemas and TypeScript types for the clawforge registry.

## Install

```bash
pnpm add @clawforge/schema
```

## Usage

```ts
import { parseEntry, EntrySchema } from "@clawforge/schema";

const entry = parseEntry(JSON.parse(await fs.readFile("entry.json", "utf8")));
// entry is narrowed by its discriminator: SkillEntry | AgentEntry | ...

// Or use the schema directly for non-throwing validation:
const result = EntrySchema.safeParse(input);
```

### Namespace IDs

```ts
import { parseId, formatId } from "@clawforge/schema";

parseId("skill:tdd-workflow");
// → { kind: "skill", user: null, name: "tdd-workflow" }

formatId({ kind: "agent", user: "kalkan", name: "code-reviewer" });
// → "agent:@kalkan/code-reviewer"
```

## Supported kinds

| Kind | Schema |
|---|---|
| `skill` | `SkillEntrySchema` |
| `agent` | `AgentEntrySchema` |
| `cmd` | `CommandEntrySchema` |
| `hook` | `HookEntrySchema` |
| `mcp` | `McpEntrySchema` |
| `preset` | `PresetEntrySchema` |

All are joined into `EntrySchema` (discriminated on `kind`).

## Stability

Breaking changes are released as major bumps. See [the clawforge design spec](../../docs/superpowers/specs/2026-04-18-clawforge-design.md).

License: MIT.
```

- [ ] **Step 2: Commit**

```bash
git add packages/schema/README.md
git commit -m "docs(schema): add package README"
```

---

### Task 19: Phase 1 sign-off

**Files:** (none)

- [ ] **Step 1: Run full repo test + lint + build**

Run:
```bash
pnpm lint && pnpm --filter @clawforge/schema typecheck && pnpm --filter @clawforge/schema test && pnpm --filter @clawforge/schema build
```

Expected: every step exits 0. Tests green, coverage thresholds met, build artifacts emitted.

- [ ] **Step 2: Tag the phase completion**

Run:
```bash
git tag phase-1-schema-complete -m "Phase 1 complete: @clawforge/schema ready for consumption by phases 2-5"
git log --oneline | head -20
```

Expected: the tag appears on the latest commit. A summary of roughly 18–22 commits from this phase is visible in the log.

- [ ] **Step 3: Update the spec's open questions**

In `H:/60_OSS/clawforge/docs/superpowers/specs/2026-04-18-clawforge-design.md`, append the following line to §11 Open questions if not already present:

```
- Phase 1 status: ✅ complete (tag `phase-1-schema-complete`, commit as of sign-off).
```

- [ ] **Step 4: Commit the spec note**

```bash
git add docs/superpowers/specs/2026-04-18-clawforge-design.md
git commit -m "docs(spec): mark phase 1 complete"
```

---

## Exit criteria (all must hold)

- [ ] `@clawforge/schema` builds cleanly (`pnpm --filter @clawforge/schema build`).
- [ ] Test coverage ≥ 95 % lines/statements/functions, ≥ 90 % branches.
- [ ] `pnpm lint` is clean across the repo.
- [ ] `EntrySchema.parse` round-trips each of the 6 kinds.
- [ ] `parseId`/`formatId` round-trip global and scoped IDs.
- [ ] The public `index.ts` exports every schema and helper listed in Task 16.
- [ ] Tag `phase-1-schema-complete` points at the last commit of this phase.
- [ ] No `any`, no `as` casts, no `// @ts-ignore` in `src/`.
- [ ] No file in `src/` exceeds 200 lines.

When every checkbox is ticked, Phase 1 is done and Phase 2 (registry build pipeline, `scripts/build-index.ts`) can begin — its plan will be written after sign-off here.
