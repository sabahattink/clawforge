# Phase 2: `@clawforge/build-index` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Ship `@clawforge/build-index` — a workspace package that turns the `registry/**/entry.json` tree into CDN-ready artefacts (`dist/registry.json`, per-kind shards, `sitemap.xml`, `feed.xml`, tombstones). Invoked by CI on every merge to `main`; also usable locally via `pnpm build:index`.

**Architecture:** Pure functions layered behind a thin CLI. Each file I/O and subprocess call sits behind an interface so tests stay hermetic. Git-log timestamps, sha256 hashes, and JSON reads are injected. The main `buildIndex` orchestrator composes them.

**Tech Stack:** TypeScript 5.9, Node 20 built-ins (`node:fs/promises`, `node:crypto`, `node:child_process`), Zod (via `@clawforge/schema`), Vitest. No runtime deps beyond `@clawforge/schema` and `execa`.

**Spec reference:** [2026-04-18-clawforge-design.md](../specs/2026-04-18-clawforge-design.md) §7.4 (build pipeline) and §4.5 (registry index shape).

---

## Prerequisites

- Phase 1 complete (tag `phase-1-schema-complete`) — `@clawforge/schema` importable.
- Node 20+, pnpm 9+, git installed and on `PATH`.
- Working directory: `H:/60_OSS/clawforge/`.

## File structure

### `packages/build-index/`

| File | Responsibility |
|---|---|
| `package.json` | Package manifest, deps on `@clawforge/schema` and `execa` |
| `tsconfig.json` | Build config (src/ only) |
| `tsconfig.test.json` | Test-scope tsconfig (src + tests) |
| `vitest.config.ts` | Vitest with coverage thresholds |
| `src/index.ts` | Public API re-exports |
| `src/bin.ts` | CLI entry point (`clawforge-build-index`) |
| `src/types.ts` | Internal types (BuildResult, BuildError, ...) |
| `src/fs/enumerate.ts` | Walks `registry/**/entry.json` |
| `src/fs/read-json.ts` | Typed JSON reader with error wrapping |
| `src/fs/write-outputs.ts` | Writes all dist artefacts |
| `src/hash/sha256.ts` | sha256 of entry content artefact |
| `src/git/timestamps.ts` | `git log` wrapper — `resolveTimestamps()` |
| `src/transform/index-entry.ts` | Entry → IndexEntry |
| `src/transform/sitemap.ts` | Builds sitemap.xml |
| `src/transform/feed.ts` | Builds feed.xml (RSS of last 50) |
| `src/transform/apply-verified.ts` | Mutates entries per `_verified.json` |
| `src/transform/filter-removed.ts` | Excludes removed entries, emits tombstones |
| `src/build.ts` | `buildIndex(ctx)` main orchestrator |
| `tests/` | Unit + integration tests (mirrors src/ layout) |
| `tests/fixtures/registry/` | Golden registry tree used by integration tests |
| `README.md` | Usage + CI snippet |

## Conventions

- Same as Phase 1: TDD per task, English commits (conventional), Biome clean, ≤ 200 lines per src file, no `any`/`!`/`@ts-ignore` in src.
- All file operations take a `root: string` argument (the registry root) — no globals, no `process.cwd()` inside pure modules.
- Subprocess (git) calls are wrapped in an injectable `GitReader` interface; tests use a `FakeGitReader`.
- All async functions return `Promise<Result<T, BuildError>>`-ish: use a discriminated union type to signal success/failure without throwing for expected errors. Throw only for unexpected bugs.

```ts
// shared result type used throughout
export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: BuildError };

export type BuildError = {
  code: string;       // e.g. "ENTRY_INVALID", "GIT_MISSING", "IO_FAIL"
  message: string;
  path?: string;
  cause?: unknown;
};
```

---

## Tasks

### Task 1: Scaffold `@clawforge/build-index`

**Files:** `packages/build-index/package.json`, `tsconfig.json`, `tsconfig.test.json`, `vitest.config.ts`, `src/index.ts`

- [ ] **Step 1: `package.json`**

```json
{
  "name": "@clawforge/build-index",
  "version": "0.0.1",
  "description": "Build the clawforge registry index from registry/**/entry.json.",
  "license": "MIT",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "bin": {
    "clawforge-build-index": "./dist/bin.js"
  },
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
    "typecheck": "tsc --noEmit && tsc --noEmit -p tsconfig.test.json"
  },
  "dependencies": {
    "@clawforge/schema": "workspace:*",
    "execa": "^9.5.0"
  },
  "devDependencies": {
    "@types/node": "^20.17.0",
    "@vitest/coverage-v8": "^2.1.0",
    "tsup": "^8.3.0",
    "typescript": "^5.9.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: `tsconfig.json`** (same shape as schema package)

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: `tsconfig.test.json`**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": { "noEmit": true },
  "include": ["src/**/*", "tests/**/*"]
}
```

- [ ] **Step 4: `vitest.config.ts`**

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
      exclude: ["src/bin.ts"],
      thresholds: { lines: 90, statements: 90, functions: 95, branches: 85 },
    },
  },
});
```

- [ ] **Step 5: `tsup.config.ts`**

```ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/bin.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  target: "node20",
});
```

- [ ] **Step 6: `src/index.ts`** (placeholder)

```ts
export {};
```

- [ ] **Step 7: Install + verify typecheck**

```bash
pnpm install
pnpm --filter @clawforge/build-index typecheck
```

Expected: exit 0.

- [ ] **Step 8: Commit**

```bash
git add packages/build-index/ pnpm-lock.yaml
git commit -m "chore(build-index): scaffold @clawforge/build-index package"
```

---

### Task 2: Shared types (`Result`, `BuildError`)

**Files:** `src/types.ts`, `tests/types.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/types.test.ts
import { describe, expect, it } from "vitest";
import { type BuildError, type Result, isOk, isErr } from "../src/types.js";

describe("Result helpers", () => {
  it("isOk narrows to success", () => {
    const r: Result<number> = { ok: true, value: 42 };
    expect(isOk(r)).toBe(true);
    if (isOk(r)) {
      const n: number = r.value;
      expect(n).toBe(42);
    }
  });

  it("isErr narrows to failure", () => {
    const err: BuildError = { code: "X", message: "x" };
    const r: Result<number> = { ok: false, error: err };
    expect(isErr(r)).toBe(true);
    if (isErr(r)) {
      expect(r.error.code).toBe("X");
    }
  });
});
```

- [ ] **Step 2: Run — fail** (`Cannot find module '../src/types.js'`)

- [ ] **Step 3: Implement `src/types.ts`**

```ts
export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: BuildError };

export type BuildError = {
  code: string;
  message: string;
  path?: string;
  cause?: unknown;
};

export function isOk<T>(r: Result<T>): r is { ok: true; value: T } {
  return r.ok;
}

export function isErr<T>(r: Result<T>): r is { ok: false; error: BuildError } {
  return !r.ok;
}
```

- [ ] **Step 4: Run — pass.** **Step 5: Commit** `feat(build-index): add Result and BuildError types`.

---

### Task 3: `readJson` — safe typed reader

**Files:** `src/fs/read-json.ts`, `tests/fs/read-json.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/fs/read-json.test.ts
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readJson } from "../../src/fs/read-json.js";
import { isErr, isOk } from "../../src/types.js";

let dir: string;
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "clawforge-readjson-"));
  writeFileSync(join(dir, "good.json"), '{"a":1}', "utf8");
  writeFileSync(join(dir, "bad.json"), "{not json}", "utf8");
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("readJson", () => {
  it("returns ok for valid JSON", async () => {
    const r = await readJson<{ a: number }>(join(dir, "good.json"));
    expect(isOk(r)).toBe(true);
    if (isOk(r)) expect(r.value.a).toBe(1);
  });

  it("returns err with IO_READ for missing file", async () => {
    const r = await readJson(join(dir, "missing.json"));
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe("IO_READ");
  });

  it("returns err with JSON_PARSE for malformed JSON", async () => {
    const r = await readJson(join(dir, "bad.json"));
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe("JSON_PARSE");
  });
});
```

- [ ] **Step 2: Run — fail.**

- [ ] **Step 3: Implement**

```ts
// src/fs/read-json.ts
import { readFile } from "node:fs/promises";
import type { Result } from "../types.js";

export async function readJson<T = unknown>(path: string): Promise<Result<T>> {
  let raw: string;
  try {
    raw = await readFile(path, "utf8");
  } catch (cause) {
    return {
      ok: false,
      error: { code: "IO_READ", message: `failed to read ${path}`, path, cause },
    };
  }
  try {
    return { ok: true, value: JSON.parse(raw) as T };
  } catch (cause) {
    return {
      ok: false,
      error: { code: "JSON_PARSE", message: `invalid JSON at ${path}`, path, cause },
    };
  }
}
```

- [ ] **Step 4: Run — pass. Step 5: Commit** `feat(build-index): add typed JSON reader`.

---

### Task 4: `enumerateEntries` — walk registry tree

**Files:** `src/fs/enumerate.ts`, `tests/fs/enumerate.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/fs/enumerate.test.ts
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { enumerateEntries } from "../../src/fs/enumerate.js";

let root: string;
beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "clawforge-enum-"));
  // valid entries
  mkdirSync(join(root, "skills", "tdd"), { recursive: true });
  writeFileSync(join(root, "skills", "tdd", "entry.json"), "{}", "utf8");
  mkdirSync(join(root, "agents", "code-reviewer"), { recursive: true });
  writeFileSync(join(root, "agents", "code-reviewer", "entry.json"), "{}", "utf8");
  // junk at root (should be ignored)
  writeFileSync(join(root, "_verified.json"), "{}", "utf8");
  writeFileSync(join(root, "README.md"), "", "utf8");
  // nested junk (should be ignored — we only match at depth 3: <kind>/<slug>/entry.json)
  mkdirSync(join(root, "skills", "tdd", "assets"), { recursive: true });
  writeFileSync(join(root, "skills", "tdd", "assets", "entry.json"), "{}", "utf8");
});
afterAll(() => rmSync(root, { recursive: true, force: true }));

describe("enumerateEntries", () => {
  it("finds exactly the <kind>/<slug>/entry.json files", async () => {
    const list = await enumerateEntries(root);
    const rel = list.map((p) => p.relativePath).sort();
    expect(rel).toEqual(["agents/code-reviewer/entry.json", "skills/tdd/entry.json"]);
  });

  it("returns kind and slug parsed from path", async () => {
    const list = await enumerateEntries(root);
    const tdd = list.find((p) => p.slug === "tdd");
    expect(tdd?.kind).toBe("skill");
  });

  it("ignores kinds that are not in the known set", async () => {
    mkdirSync(join(root, "unknowns", "foo"), { recursive: true });
    writeFileSync(join(root, "unknowns", "foo", "entry.json"), "{}", "utf8");
    const list = await enumerateEntries(root);
    expect(list.find((p) => p.slug === "foo")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run — fail.**

- [ ] **Step 3: Implement**

```ts
// src/fs/enumerate.ts
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { KINDS, type Kind } from "@clawforge/schema";

export type EntryLocation = {
  kind: Kind;
  slug: string;
  absolutePath: string;
  relativePath: string;
  dir: string;
};

const KIND_DIRS: Record<string, Kind> = {
  skills: "skill",
  agents: "agent",
  commands: "cmd",
  hooks: "hook",
  "mcp-servers": "mcp",
  presets: "preset",
};

export async function enumerateEntries(registryRoot: string): Promise<EntryLocation[]> {
  const out: EntryLocation[] = [];
  const topLevel = await safeReaddir(registryRoot);
  for (const kindDir of topLevel) {
    const kind = KIND_DIRS[kindDir];
    if (kind === undefined) continue;
    const kindRoot = join(registryRoot, kindDir);
    const slugDirs = await safeReaddir(kindRoot, { withFileTypes: true });
    for (const entry of slugDirs) {
      if (!entry.isDirectory()) continue;
      const slug = entry.name;
      const entryJson = join(kindRoot, slug, "entry.json");
      const rel = `${kindDir}/${slug}/entry.json`;
      out.push({
        kind,
        slug,
        absolutePath: entryJson,
        relativePath: rel,
        dir: join(kindRoot, slug),
      });
    }
  }
  // sanity: each path must exist
  return (
    await Promise.all(
      out.map(async (loc) => ((await pathExists(loc.absolutePath)) ? loc : null)),
    )
  ).filter((x): x is EntryLocation => x !== null);
}

async function safeReaddir(dir: string): Promise<string[]>;
async function safeReaddir(
  dir: string,
  opts: { withFileTypes: true },
): Promise<import("node:fs").Dirent[]>;
async function safeReaddir(dir: string, opts?: { withFileTypes: true }) {
  try {
    if (opts?.withFileTypes) return await readdir(dir, { withFileTypes: true });
    return await readdir(dir);
  } catch {
    return [];
  }
}

async function pathExists(p: string): Promise<boolean> {
  try {
    const { stat } = await import("node:fs/promises");
    await stat(p);
    return true;
  } catch {
    return false;
  }
}
```

Also mention: the exported `KINDS` tuple from `@clawforge/schema` is not used here directly because we use a directory-name mapping; but keep the import to validate we parse into valid Kinds. (If the reviewer flags dead import, drop it.)

- [ ] **Step 4: Run — pass. Step 5: Commit** `feat(build-index): enumerate registry entries by <kind>/<slug>/entry.json`.

---

### Task 5: `computeContentSha256`

**Files:** `src/hash/sha256.ts`, `tests/hash/sha256.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/hash/sha256.test.ts
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { computeContentSha256 } from "../../src/hash/sha256.js";

let dir: string;
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "clawforge-sha-"));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "a.md"), "hello", "utf8");
  writeFileSync(join(dir, "b.md"), "world", "utf8");
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("computeContentSha256", () => {
  it("hashes a single file deterministically", async () => {
    const h1 = await computeContentSha256(dir, ["a.md"]);
    const h2 = await computeContentSha256(dir, ["a.md"]);
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[a-f0-9]{64}$/);
  });

  it("order of files is preserved in concatenation", async () => {
    const ab = await computeContentSha256(dir, ["a.md", "b.md"]);
    const ba = await computeContentSha256(dir, ["b.md", "a.md"]);
    expect(ab).not.toBe(ba);
  });
});
```

- [ ] **Step 2: Run — fail.**

- [ ] **Step 3: Implement**

```ts
// src/hash/sha256.ts
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function computeContentSha256(
  entryDir: string,
  relativeFiles: readonly string[],
): Promise<string> {
  const hash = createHash("sha256");
  for (const rel of relativeFiles) {
    const buf = await readFile(join(entryDir, rel));
    hash.update(buf);
  }
  return hash.digest("hex");
}
```

- [ ] **Step 4: Run — pass. Step 5: Commit** `feat(build-index): add content sha256 helper`.

---

### Task 6: `GitReader` interface + `ExecaGitReader`

**Files:** `src/git/timestamps.ts`, `tests/git/timestamps.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/git/timestamps.test.ts
import { describe, expect, it } from "vitest";
import { resolveTimestamps, type GitReader } from "../../src/git/timestamps.js";

const fixedGit: GitReader = {
  async firstCommitDate(path) {
    return path.endsWith("skills/tdd/entry.json") ? "2026-02-01T09:00:00.000Z" : null;
  },
  async lastCommitDate(path) {
    return path.endsWith("skills/tdd/entry.json") ? "2026-04-10T18:00:00.000Z" : null;
  },
  async lastCommitSha() {
    return "a1b2c3d4e5f6";
  },
};

describe("resolveTimestamps", () => {
  it("returns createdAt, updatedAt and sourceCommit for a known file", async () => {
    const r = await resolveTimestamps(fixedGit, "registry/skills/tdd/entry.json");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.createdAt).toBe("2026-02-01T09:00:00.000Z");
      expect(r.value.updatedAt).toBe("2026-04-10T18:00:00.000Z");
      expect(r.value.sourceCommit).toBe("a1b2c3d4e5f6");
    }
  });

  it("returns err if no commit history is found", async () => {
    const r = await resolveTimestamps(fixedGit, "registry/skills/missing/entry.json");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("GIT_NO_HISTORY");
  });
});
```

- [ ] **Step 2: Run — fail.**

- [ ] **Step 3: Implement**

```ts
// src/git/timestamps.ts
import { execa } from "execa";
import type { Result } from "../types.js";

export type GitReader = {
  firstCommitDate(path: string): Promise<string | null>;
  lastCommitDate(path: string): Promise<string | null>;
  lastCommitSha(): Promise<string>;
};

export type ResolvedTimestamps = {
  createdAt: string;
  updatedAt: string;
  sourceCommit: string;
};

export async function resolveTimestamps(
  git: GitReader,
  path: string,
): Promise<Result<ResolvedTimestamps>> {
  const [createdAt, updatedAt] = await Promise.all([
    git.firstCommitDate(path),
    git.lastCommitDate(path),
  ]);
  if (createdAt === null || updatedAt === null) {
    return {
      ok: false,
      error: { code: "GIT_NO_HISTORY", message: `no git history for ${path}`, path },
    };
  }
  const sourceCommit = await git.lastCommitSha();
  return { ok: true, value: { createdAt, updatedAt, sourceCommit } };
}

export class ExecaGitReader implements GitReader {
  constructor(private readonly cwd: string) {}

  async firstCommitDate(path: string): Promise<string | null> {
    return this.runLog(path, "--diff-filter=A", true);
  }

  async lastCommitDate(path: string): Promise<string | null> {
    return this.runLog(path, undefined, false);
  }

  async lastCommitSha(): Promise<string> {
    const { stdout } = await execa("git", ["rev-parse", "HEAD"], { cwd: this.cwd });
    return stdout.trim();
  }

  private async runLog(
    path: string,
    extra: string | undefined,
    first: boolean,
  ): Promise<string | null> {
    const args = ["log", "--format=%aI"];
    if (extra !== undefined) args.push(extra);
    args.push("--", path);
    const { stdout } = await execa("git", args, { cwd: this.cwd });
    const lines = stdout.split("\n").filter(Boolean);
    if (lines.length === 0) return null;
    const chosen = first ? lines[lines.length - 1] : lines[0];
    return chosen ?? null;
  }
}
```

- [ ] **Step 4: Run — pass. Step 5: Commit** `feat(build-index): add GitReader interface with execa backend`.

---

### Task 7: `toIndexEntry` transform

**Files:** `src/transform/index-entry.ts`, `tests/transform/index-entry.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/transform/index-entry.test.ts
import { describe, expect, it } from "vitest";
import { toIndexEntry } from "../../src/transform/index-entry.js";
import type { Entry } from "@clawforge/schema";

const skill: Entry = {
  kind: "skill",
  name: "tdd-workflow",
  displayName: "TDD Workflow",
  description: "Write tests first.",
  author: { name: "Kalkan", github: "kalkan" },
  tags: ["tdd"],
  category: "testing",
  version: "1.2.0",
  license: "MIT",
  verified: true,
  createdAt: "2026-02-01T09:00:00.000Z",
  updatedAt: "2026-04-10T18:00:00.000Z",
  sourceCommit: "a".repeat(40),
  sha256: "b".repeat(64),
  files: [{ source: "skill.md", target: "{{CLAUDE_DIR}}/skills/{{name}}/SKILL.md" }],
};

describe("toIndexEntry", () => {
  it("produces a valid global-namespace index entry", () => {
    const ix = toIndexEntry(skill, "https://cdn.clawforge.dev");
    expect(ix.id).toBe("skill:tdd-workflow");
    expect(ix.detailUrl).toBe("https://cdn.clawforge.dev/skills/tdd-workflow/entry.json");
    expect(ix.author).toBe("kalkan");
    expect(ix.verified).toBe(true);
  });
});
```

- [ ] **Step 2: Run — fail. Step 3: Implement**

```ts
// src/transform/index-entry.ts
import type { Entry, IndexEntry } from "@clawforge/schema";

export function toIndexEntry(entry: Entry, cdnBase: string): IndexEntry {
  const kindDir = toKindDir(entry.kind);
  return {
    id: `${entry.kind}:${entry.name}`,
    kind: entry.kind,
    name: entry.name,
    displayName: entry.displayName,
    description: entry.description,
    tags: entry.tags,
    category: entry.category,
    verified: entry.verified,
    version: entry.version,
    author: entry.author.github,
    detailUrl: `${cdnBase.replace(/\/$/, "")}/${kindDir}/${entry.name}/entry.json`,
    sha256: entry.sha256,
    updatedAt: entry.updatedAt,
  };
}

function toKindDir(kind: Entry["kind"]): string {
  switch (kind) {
    case "skill":
      return "skills";
    case "agent":
      return "agents";
    case "cmd":
      return "commands";
    case "hook":
      return "hooks";
    case "mcp":
      return "mcp-servers";
    case "preset":
      return "presets";
  }
}
```

- [ ] **Step 4: Run — pass. Step 5: Commit** `feat(build-index): add Entry → IndexEntry transform`.

---

### Task 8: `applyVerifiedIndex`

**Files:** `src/transform/apply-verified.ts`, `tests/transform/apply-verified.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/transform/apply-verified.test.ts
import { describe, expect, it } from "vitest";
import type { Entry, VerifiedIndex } from "@clawforge/schema";
import { applyVerifiedIndex } from "../../src/transform/apply-verified.js";

const e = (kind: "skill", name: string, version: string, verified: boolean): Entry =>
  ({
    kind,
    name,
    displayName: name,
    description: "x",
    author: { name: "a", github: "a" },
    tags: [],
    category: "testing",
    version,
    license: "MIT",
    verified,
    createdAt: "2026-02-01T09:00:00.000Z",
    updatedAt: "2026-04-10T18:00:00.000Z",
    sourceCommit: "a".repeat(40),
    sha256: "b".repeat(64),
    files: [{ source: "skill.md", target: "{{CLAUDE_DIR}}/skills/{{name}}/SKILL.md" }],
  }) as Entry;

const idx: VerifiedIndex = {
  version: 1,
  entries: {
    "skill:tdd": {
      verifiedAt: "2026-04-15T12:00:00.000Z",
      verifiedBy: "kalkan",
      verifiedVersion: "1.2.0",
      reason: "good",
      expiresAt: null,
    },
  },
};

describe("applyVerifiedIndex", () => {
  it("sets verified=true when id+version match", () => {
    const entries = [e("skill", "tdd", "1.2.0", false)];
    const result = applyVerifiedIndex(entries, idx);
    expect(result[0]?.verified).toBe(true);
  });

  it("keeps verified=false when version mismatches", () => {
    const entries = [e("skill", "tdd", "1.3.0", false)];
    const result = applyVerifiedIndex(entries, idx);
    expect(result[0]?.verified).toBe(false);
  });

  it("keeps verified=false for unknown ids", () => {
    const entries = [e("skill", "other", "1.0.0", true)];
    const result = applyVerifiedIndex(entries, idx);
    expect(result[0]?.verified).toBe(false);
  });
});
```

- [ ] **Step 2: Run — fail. Step 3: Implement**

```ts
// src/transform/apply-verified.ts
import type { Entry, VerifiedIndex } from "@clawforge/schema";

export function applyVerifiedIndex(entries: Entry[], idx: VerifiedIndex): Entry[] {
  return entries.map((entry) => {
    const id = `${entry.kind}:${entry.name}`;
    const record = idx.entries[id];
    const verified = record !== undefined && record.verifiedVersion === entry.version;
    return { ...entry, verified } as Entry;
  });
}
```

- [ ] **Step 4: Run — pass. Step 5: Commit** `feat(build-index): apply _verified.json to entries`.

---

### Task 9: `filterRemoved`

**Files:** `src/transform/filter-removed.ts`, `tests/transform/filter-removed.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/transform/filter-removed.test.ts
import { describe, expect, it } from "vitest";
import type { Entry, RemovedIndex } from "@clawforge/schema";
import { filterRemoved } from "../../src/transform/filter-removed.js";

const mkEntry = (name: string): Entry =>
  ({
    kind: "skill",
    name,
    displayName: name,
    description: "x",
    author: { name: "a", github: "a" },
    tags: [],
    category: "testing",
    version: "1.0.0",
    license: "MIT",
    verified: false,
    createdAt: "2026-02-01T09:00:00.000Z",
    updatedAt: "2026-04-10T18:00:00.000Z",
    sourceCommit: "a".repeat(40),
    sha256: "b".repeat(64),
    files: [{ source: "skill.md", target: "{{CLAUDE_DIR}}/skills/{{name}}/SKILL.md" }],
  }) as Entry;

const removed: RemovedIndex = {
  version: 1,
  entries: {
    "skill:evil": {
      removedAt: "2026-04-18T00:00:00.000Z",
      reason: "bad",
      category: "malicious",
    },
  },
};

describe("filterRemoved", () => {
  it("excludes entries listed in _removed.json", () => {
    const out = filterRemoved([mkEntry("good"), mkEntry("evil")], removed);
    expect(out.map((e) => e.name)).toEqual(["good"]);
  });
});
```

- [ ] **Step 2: Run — fail. Step 3: Implement**

```ts
// src/transform/filter-removed.ts
import type { Entry, RemovedIndex } from "@clawforge/schema";

export function filterRemoved(entries: Entry[], idx: RemovedIndex): Entry[] {
  const removed = new Set(Object.keys(idx.entries));
  return entries.filter((e) => !removed.has(`${e.kind}:${e.name}`));
}
```

- [ ] **Step 4: Run — pass. Step 5: Commit** `feat(build-index): filter removed entries out of main index`.

---

### Task 10: `assembleIndex`

**Files:** `src/transform/assemble.ts`, `tests/transform/assemble.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/transform/assemble.test.ts
import { describe, expect, it } from "vitest";
import { assembleIndex } from "../../src/transform/assemble.js";
import type { IndexEntry } from "@clawforge/schema";

const ix = (id: string): IndexEntry => ({
  id,
  kind: "skill",
  name: id.split(":")[1] ?? "x",
  displayName: id,
  description: "x",
  tags: [],
  category: "testing",
  verified: false,
  version: "1.0.0",
  author: "kalkan",
  detailUrl: `https://cdn.clawforge.dev/${id}/entry.json`,
  sha256: "a".repeat(64),
  updatedAt: "2026-04-10T18:00:00.000Z",
});

describe("assembleIndex", () => {
  it("builds a RegistryIndex with count and generatedAt", () => {
    const idx = assembleIndex([ix("skill:a"), ix("skill:b")], "2026-04-18T12:00:00.000Z");
    expect(idx.count).toBe(2);
    expect(idx.generatedAt).toBe("2026-04-18T12:00:00.000Z");
    expect(idx.entries).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run — fail. Step 3: Implement**

```ts
// src/transform/assemble.ts
import type { IndexEntry, RegistryIndex } from "@clawforge/schema";

export function assembleIndex(entries: IndexEntry[], generatedAt: string): RegistryIndex {
  return { version: 1, generatedAt, count: entries.length, entries };
}

export function shardByKind(
  entries: IndexEntry[],
  generatedAt: string,
): Record<string, RegistryIndex> {
  const buckets: Record<string, IndexEntry[]> = {};
  for (const entry of entries) {
    (buckets[entry.kind] ??= []).push(entry);
  }
  const result: Record<string, RegistryIndex> = {};
  for (const [kind, list] of Object.entries(buckets)) {
    result[kind] = assembleIndex(list, generatedAt);
  }
  return result;
}
```

- [ ] **Step 4: Run — pass. Add a second test for `shardByKind`:**

```ts
it("shards entries into per-kind indexes", () => {
  const all = [ix("skill:a"), { ...ix("agent:b"), kind: "agent" as const }];
  const shards = shardByKind(all, "2026-04-18T12:00:00.000Z");
  expect(Object.keys(shards).sort()).toEqual(["agent", "skill"]);
  expect(shards.skill?.count).toBe(1);
});
```

Run again → pass.

- [ ] **Step 5: Commit** `feat(build-index): assemble full and per-kind index shards`.

---

### Task 11: `generateSitemap`

**Files:** `src/transform/sitemap.ts`, `tests/transform/sitemap.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/transform/sitemap.test.ts
import { describe, expect, it } from "vitest";
import { generateSitemap } from "../../src/transform/sitemap.js";

describe("generateSitemap", () => {
  it("emits urls for every entry", () => {
    const xml = generateSitemap({
      siteBase: "https://clawforge.dev",
      entries: [
        {
          kind: "skill",
          name: "tdd",
          updatedAt: "2026-04-10T18:00:00.000Z",
        },
      ],
    });
    expect(xml).toContain("https://clawforge.dev/skill/tdd");
    expect(xml).toContain("<lastmod>2026-04-10</lastmod>");
    expect(xml.startsWith(`<?xml version="1.0"`)).toBe(true);
  });

  it("escapes special characters in URLs", () => {
    const xml = generateSitemap({
      siteBase: "https://clawforge.dev",
      entries: [{ kind: "skill", name: "a&b", updatedAt: "2026-04-10T18:00:00.000Z" }],
    });
    expect(xml).toContain("a&amp;b");
    expect(xml).not.toMatch(/<loc>[^<]*&[^a#l]/);
  });
});
```

- [ ] **Step 2: Run — fail. Step 3: Implement**

```ts
// src/transform/sitemap.ts
export type SitemapEntry = {
  kind: string;
  name: string;
  updatedAt: string;
};

export type SitemapInput = {
  siteBase: string;
  entries: readonly SitemapEntry[];
};

export function generateSitemap({ siteBase, entries }: SitemapInput): string {
  const base = siteBase.replace(/\/$/, "");
  const urls = entries.map((e) => {
    const loc = `${base}/${e.kind}/${escapeXml(e.name)}`;
    const lastmod = e.updatedAt.slice(0, 10);
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
  });
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
```

- [ ] **Step 4: Run — pass. Step 5: Commit** `feat(build-index): add sitemap.xml generator`.

---

### Task 12: `generateFeed` (RSS)

**Files:** `src/transform/feed.ts`, `tests/transform/feed.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/transform/feed.test.ts
import { describe, expect, it } from "vitest";
import { generateFeed } from "../../src/transform/feed.js";

describe("generateFeed", () => {
  it("emits newest entries first, capped at 50", () => {
    const entries = Array.from({ length: 60 }, (_, i) => ({
      kind: "skill",
      name: `e${i}`,
      displayName: `E${i}`,
      description: "x",
      updatedAt: `2026-04-${String(18 - (i % 18)).padStart(2, "0")}T12:00:00.000Z`,
    }));
    const xml = generateFeed({ siteBase: "https://clawforge.dev", entries });
    const itemCount = (xml.match(/<item>/g) ?? []).length;
    expect(itemCount).toBe(50);
  });

  it("includes channel metadata", () => {
    const xml = generateFeed({ siteBase: "https://clawforge.dev", entries: [] });
    expect(xml).toContain("<title>clawforge — new entries</title>");
    expect(xml).toContain("<link>https://clawforge.dev</link>");
  });
});
```

- [ ] **Step 2: Run — fail. Step 3: Implement**

```ts
// src/transform/feed.ts
export type FeedEntry = {
  kind: string;
  name: string;
  displayName: string;
  description: string;
  updatedAt: string;
};

export type FeedInput = {
  siteBase: string;
  entries: readonly FeedEntry[];
};

export function generateFeed({ siteBase, entries }: FeedInput): string {
  const base = siteBase.replace(/\/$/, "");
  const sorted = [...entries].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  const latest = sorted.slice(0, 50);
  const items = latest.map(
    (e) =>
      `  <item>\n    <title>${esc(e.displayName)}</title>\n    <link>${base}/${e.kind}/${esc(e.name)}</link>\n    <guid isPermaLink="true">${base}/${e.kind}/${esc(e.name)}</guid>\n    <pubDate>${new Date(e.updatedAt).toUTCString()}</pubDate>\n    <description>${esc(e.description)}</description>\n  </item>`,
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss version="2.0">`,
    `<channel>`,
    `  <title>clawforge — new entries</title>`,
    `  <link>${base}</link>`,
    `  <description>Newly added entries to clawforge.</description>`,
    ...items,
    `</channel>`,
    `</rss>`,
  ].join("\n");
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
```

- [ ] **Step 4: Run — pass. Step 5: Commit** `feat(build-index): add RSS feed generator (last 50)`.

---

### Task 13: `writeOutputs`

**Files:** `src/fs/write-outputs.ts`, `tests/fs/write-outputs.test.ts`

- [ ] **Step 1: Failing test**

```ts
// tests/fs/write-outputs.test.ts
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { writeOutputs } from "../../src/fs/write-outputs.js";

let dir: string;
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "clawforge-write-"));
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("writeOutputs", () => {
  it("writes registry.json, per-kind shards, sitemap.xml, feed.xml", async () => {
    await writeOutputs({
      distDir: dir,
      registryIndex: { version: 1, generatedAt: "2026-04-18T12:00:00.000Z", count: 0, entries: [] },
      shards: {
        skill: { version: 1, generatedAt: "2026-04-18T12:00:00.000Z", count: 0, entries: [] },
      },
      sitemap: "<sitemap/>",
      feed: "<rss/>",
      tombstones: { version: 1, entries: {} },
    });
    expect(JSON.parse(readFileSync(join(dir, "registry.json"), "utf8")).count).toBe(0);
    expect(readFileSync(join(dir, "skills.json"), "utf8")).toContain("generatedAt");
    expect(readFileSync(join(dir, "sitemap.xml"), "utf8")).toBe("<sitemap/>");
    expect(readFileSync(join(dir, "feed.xml"), "utf8")).toBe("<rss/>");
    expect(readFileSync(join(dir, "tombstones.json"), "utf8")).toContain("entries");
  });
});
```

- [ ] **Step 2: Run — fail. Step 3: Implement**

```ts
// src/fs/write-outputs.ts
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { RegistryIndex, RemovedIndex } from "@clawforge/schema";

const KIND_TO_FILENAME: Record<string, string> = {
  skill: "skills.json",
  agent: "agents.json",
  cmd: "commands.json",
  hook: "hooks.json",
  mcp: "mcp.json",
  preset: "presets.json",
};

export type WriteOutputsInput = {
  distDir: string;
  registryIndex: RegistryIndex;
  shards: Record<string, RegistryIndex>;
  sitemap: string;
  feed: string;
  tombstones: RemovedIndex;
};

export async function writeOutputs(input: WriteOutputsInput): Promise<void> {
  await mkdir(input.distDir, { recursive: true });
  await writeFile(
    join(input.distDir, "registry.json"),
    `${JSON.stringify(input.registryIndex, null, 2)}\n`,
    "utf8",
  );
  for (const [kind, shard] of Object.entries(input.shards)) {
    const filename = KIND_TO_FILENAME[kind];
    if (filename === undefined) continue;
    await writeFile(join(input.distDir, filename), `${JSON.stringify(shard, null, 2)}\n`, "utf8");
  }
  await writeFile(join(input.distDir, "sitemap.xml"), input.sitemap, "utf8");
  await writeFile(join(input.distDir, "feed.xml"), input.feed, "utf8");
  await writeFile(
    join(input.distDir, "tombstones.json"),
    `${JSON.stringify(input.tombstones, null, 2)}\n`,
    "utf8",
  );
}
```

- [ ] **Step 4: Run — pass. Step 5: Commit** `feat(build-index): write dist artefacts to disk`.

---

### Task 14: `buildIndex` orchestrator

**Files:** `src/build.ts`, `tests/build.test.ts`, `tests/fixtures/registry/*`

- [ ] **Step 1: Create fixture registry**

Create `packages/build-index/tests/fixtures/registry/` with two valid entries and a `_verified.json` + `_removed.json`. Example layout:

```
tests/fixtures/registry/
├── skills/
│   └── tdd-workflow/
│       ├── entry.json
│       └── skill.md
├── agents/
│   └── code-reviewer/
│       ├── entry.json
│       └── agent.md
├── _verified.json
└── _removed.json
```

Each `entry.json` contains a valid `BaseEntry` + kind-specific fields, matching the schema. `_verified.json` verifies `skill:tdd-workflow`. `_removed.json` is empty.

Note: `createdAt`, `updatedAt`, and `sourceCommit` in fixture entry.json can be dummy values — the build process will overwrite them from git log. For test determinism, we inject a `FakeGitReader`.

- [ ] **Step 2: Failing test**

```ts
// tests/build.test.ts
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { GitReader } from "../src/git/timestamps.js";
import { buildIndex } from "../src/build.js";

const fixtureRoot = resolve(__dirname, "fixtures/registry");
let distDir: string;

const fakeGit: GitReader = {
  async firstCommitDate() {
    return "2026-02-01T09:00:00.000Z";
  },
  async lastCommitDate() {
    return "2026-04-10T18:00:00.000Z";
  },
  async lastCommitSha() {
    return "a".repeat(40);
  },
};

beforeAll(() => {
  distDir = mkdtempSync(join(tmpdir(), "clawforge-build-"));
});
afterAll(() => rmSync(distDir, { recursive: true, force: true }));

describe("buildIndex", () => {
  it("produces a RegistryIndex matching the fixture entries", async () => {
    const result = await buildIndex({
      registryRoot: fixtureRoot,
      distDir,
      cdnBase: "https://cdn.clawforge.dev",
      siteBase: "https://clawforge.dev",
      generatedAt: "2026-04-18T12:00:00.000Z",
      git: fakeGit,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.registryIndex.count).toBe(2);
      const ids = result.value.registryIndex.entries.map((e) => e.id).sort();
      expect(ids).toEqual(["agent:code-reviewer", "skill:tdd-workflow"]);
      const skill = result.value.registryIndex.entries.find((e) => e.id === "skill:tdd-workflow");
      expect(skill?.verified).toBe(true);
    }
  });
});
```

- [ ] **Step 3: Run — fail.**

- [ ] **Step 4: Implement `src/build.ts`**

```ts
// src/build.ts
import { join } from "node:path";
import { parseEntry, type RegistryIndex, type RemovedIndex, type VerifiedIndex } from "@clawforge/schema";
import { enumerateEntries } from "./fs/enumerate.js";
import { readJson } from "./fs/read-json.js";
import { writeOutputs } from "./fs/write-outputs.js";
import { resolveTimestamps, type GitReader } from "./git/timestamps.js";
import { computeContentSha256 } from "./hash/sha256.js";
import { applyVerifiedIndex } from "./transform/apply-verified.js";
import { assembleIndex, shardByKind } from "./transform/assemble.js";
import { generateFeed } from "./transform/feed.js";
import { filterRemoved } from "./transform/filter-removed.js";
import { toIndexEntry } from "./transform/index-entry.js";
import { generateSitemap } from "./transform/sitemap.js";
import type { BuildError, Result } from "./types.js";

export type BuildContext = {
  registryRoot: string;
  distDir: string;
  cdnBase: string;
  siteBase: string;
  generatedAt: string;
  git: GitReader;
};

export type BuildResult = {
  registryIndex: RegistryIndex;
  shards: Record<string, RegistryIndex>;
  errors: BuildError[];
};

export async function buildIndex(ctx: BuildContext): Promise<Result<BuildResult>> {
  const verifiedRead = await readJson<VerifiedIndex>(
    join(ctx.registryRoot, "_verified.json"),
  );
  const verified: VerifiedIndex = verifiedRead.ok
    ? verifiedRead.value
    : { version: 1, entries: {} };

  const removedRead = await readJson<RemovedIndex>(join(ctx.registryRoot, "_removed.json"));
  const removed: RemovedIndex = removedRead.ok
    ? removedRead.value
    : { version: 1, entries: {} };

  const locations = await enumerateEntries(ctx.registryRoot);
  const parsedEntries = [];
  const errors: BuildError[] = [];

  for (const loc of locations) {
    const jsonRead = await readJson(loc.absolutePath);
    if (!jsonRead.ok) {
      errors.push(jsonRead.error);
      continue;
    }
    let entry;
    try {
      entry = parseEntry(jsonRead.value);
    } catch (cause) {
      errors.push({
        code: "ENTRY_INVALID",
        message: (cause as Error).message,
        path: loc.absolutePath,
        cause,
      });
      continue;
    }

    const ts = await resolveTimestamps(ctx.git, loc.relativePath);
    if (!ts.ok) {
      errors.push(ts.error);
      continue;
    }

    const fileList = "files" in entry ? entry.files.map((f) => f.source) : [];
    const snippetList = "snippetFile" in entry ? [entry.snippetFile] : [];
    const patchList =
      entry.kind === "preset" && entry.settingsPatch !== undefined
        ? [entry.settingsPatch]
        : [];
    const hashInputs = [...fileList, ...snippetList, ...patchList];
    const sha256 =
      hashInputs.length > 0
        ? await computeContentSha256(loc.dir, hashInputs)
        : "0".repeat(64);

    parsedEntries.push({
      ...entry,
      createdAt: ts.value.createdAt,
      updatedAt: ts.value.updatedAt,
      sourceCommit: ts.value.sourceCommit,
      sha256,
    } as typeof entry);
  }

  const afterVerified = applyVerifiedIndex(parsedEntries, verified);
  const afterRemoved = filterRemoved(afterVerified, removed);
  const indexEntries = afterRemoved.map((e) => toIndexEntry(e, ctx.cdnBase));
  const registryIndex = assembleIndex(indexEntries, ctx.generatedAt);
  const shards = shardByKind(indexEntries, ctx.generatedAt);

  const sitemap = generateSitemap({
    siteBase: ctx.siteBase,
    entries: indexEntries.map((e) => ({
      kind: e.kind,
      name: e.name,
      updatedAt: e.updatedAt,
    })),
  });
  const feed = generateFeed({
    siteBase: ctx.siteBase,
    entries: indexEntries.map((e) => ({
      kind: e.kind,
      name: e.name,
      displayName: e.displayName,
      description: e.description,
      updatedAt: e.updatedAt,
    })),
  });

  await writeOutputs({
    distDir: ctx.distDir,
    registryIndex,
    shards,
    sitemap,
    feed,
    tombstones: removed,
  });

  return { ok: true, value: { registryIndex, shards, errors } };
}
```

- [ ] **Step 5: Run — pass. Step 6: Commit** `feat(build-index): add buildIndex orchestrator`.

---

### Task 15: CLI (`src/bin.ts`)

**Files:** `src/bin.ts`

- [ ] **Step 1: Implement directly** (CLI tested via Task 16 e2e, not unit-tested)

```ts
#!/usr/bin/env node
// src/bin.ts
import { resolve } from "node:path";
import { buildIndex } from "./build.js";
import { ExecaGitReader } from "./git/timestamps.js";

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const opts: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key === undefined || value === undefined) break;
    opts[key.replace(/^--/, "")] = value;
  }

  const registryRoot = resolve(opts["registry"] ?? "registry");
  const distDir = resolve(opts["out"] ?? "dist");
  const cdnBase = opts["cdn-base"] ?? "https://cdn.clawforge.dev";
  const siteBase = opts["site-base"] ?? "https://clawforge.dev";
  const generatedAt = opts["generated-at"] ?? new Date().toISOString();

  const git = new ExecaGitReader(process.cwd());
  const result = await buildIndex({
    registryRoot,
    distDir,
    cdnBase,
    siteBase,
    generatedAt,
    git,
  });

  if (!result.ok) {
    process.stderr.write(`build-index failed: ${result.error.message}\n`);
    process.exit(1);
  }
  if (result.value.errors.length > 0) {
    for (const err of result.value.errors) {
      process.stderr.write(`! ${err.code}: ${err.message}${err.path ? ` (${err.path})` : ""}\n`);
    }
    process.exit(2);
  }
  process.stdout.write(
    `build-index: ${result.value.registryIndex.count} entries → ${distDir}\n`,
  );
}

main().catch((err: unknown) => {
  process.stderr.write(`unexpected: ${(err as Error).message}\n`);
  process.exit(3);
});
```

- [ ] **Step 2: Wire into root `package.json`**

Add a root script:

```json
"scripts": {
  ...,
  "build:index": "pnpm --filter @clawforge/build-index build && node packages/build-index/dist/bin.js --registry registry --out dist --cdn-base https://cdn.clawforge.dev --site-base https://clawforge.dev"
}
```

(Apply this as an Edit on root `package.json`.)

- [ ] **Step 3: Commit** `feat(build-index): add CLI entry point and root build:index script`.

---

### Task 16: Public API + smoke build

**Files:** `src/index.ts`

- [ ] **Step 1: Replace content**

```ts
// src/index.ts
export { buildIndex, type BuildContext, type BuildResult } from "./build.js";
export { ExecaGitReader, type GitReader } from "./git/timestamps.js";
export type { BuildError, Result } from "./types.js";
```

- [ ] **Step 2: Typecheck + test + build**

```bash
pnpm --filter @clawforge/build-index typecheck
pnpm --filter @clawforge/build-index test
pnpm --filter @clawforge/build-index build
```

Expected: all green. Coverage thresholds met (bin.ts excluded).

- [ ] **Step 3: Biome**

```bash
pnpm lint
```

Fix any formatting issues with `pnpm exec biome check --write .`.

- [ ] **Step 4: Commit** `feat(build-index): expose public API`.

---

### Task 17: Package README

**Files:** `packages/build-index/README.md`

- [ ] **Step 1: Write README**

```markdown
# @clawforge/build-index

Builds CDN-ready artefacts from the clawforge registry tree.

## Usage (CLI)

\`\`\`bash
clawforge-build-index \
  --registry ./registry \
  --out ./dist \
  --cdn-base https://cdn.clawforge.dev \
  --site-base https://clawforge.dev
\`\`\`

Outputs (in `--out`):

- `registry.json` — full index
- `skills.json`, `agents.json`, `commands.json`, `hooks.json`, `mcp.json`, `presets.json`
- `sitemap.xml`, `feed.xml`
- `tombstones.json`

## Usage (programmatic)

\`\`\`ts
import { buildIndex, ExecaGitReader } from "@clawforge/build-index";

const result = await buildIndex({
  registryRoot: "./registry",
  distDir: "./dist",
  cdnBase: "https://cdn.clawforge.dev",
  siteBase: "https://clawforge.dev",
  generatedAt: new Date().toISOString(),
  git: new ExecaGitReader(process.cwd()),
});
\`\`\`

## CI requirement

`actions/checkout` must use `fetch-depth: 0` so that `git log` can resolve `createdAt`/`updatedAt`.

License: MIT.
```

Replace each literal `\`\`\`` with real triple-backticks in the actual file.

- [ ] **Step 2: Commit** `docs(build-index): add package README`.

---

### Task 18: Phase 2 sign-off

- [ ] **Step 1: Full verification**

```bash
pnpm lint && \
  pnpm --filter @clawforge/build-index typecheck && \
  pnpm --filter @clawforge/build-index test && \
  pnpm --filter @clawforge/build-index build
```

- [ ] **Step 2: Update spec**

Append to §11 Phase progress:

```
- Phase 2 (`@clawforge/build-index`): ✅ complete — tag `phase-2-build-index-complete`, coverage thresholds met, fixture-based e2e test green.
```

- [ ] **Step 3: Tag + commit spec note**

```bash
git tag phase-2-build-index-complete -m "Phase 2 complete: @clawforge/build-index"
git add docs/superpowers/specs/2026-04-18-clawforge-design.md
git commit -m "docs(spec): mark phase 2 complete"
```

---

## Exit criteria

- [ ] `@clawforge/build-index` builds cleanly and binary is emitted.
- [ ] Fixture-based e2e test (`buildIndex`) produces a valid `RegistryIndex` with `verified` flags applied correctly and removed entries excluded.
- [ ] Coverage thresholds met (lines/statements ≥ 90, functions ≥ 95, branches ≥ 85; `bin.ts` excluded from coverage).
- [ ] `pnpm lint` clean.
- [ ] `scripts.build:index` at repo root runs end-to-end (may be a no-op if `registry/` is empty — that's acceptable; it will have content once Phase 8 lands).
- [ ] No `any`, no `!`, no `@ts-ignore` in `src/` (except `bin.ts` argv parsing if unavoidable).
- [ ] Tag `phase-2-build-index-complete` on the latest commit of this phase.

When green, Phase 3 (`@clawforge/validator`) planning begins.
