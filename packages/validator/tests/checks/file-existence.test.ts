import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { checkFileExistence } from "../../src/checks/file-existence.js";
import type { LoadedEntry } from "../../src/checks/schema.js";

let root: string;
beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "clawforge-fe-"));
  mkdirSync(join(root, "skills", "tdd"), { recursive: true });
  writeFileSync(join(root, "skills", "tdd", "skill.md"), "content", "utf8");
});
afterAll(() => rmSync(root, { recursive: true, force: true }));

describe("checkFileExistence", () => {
  it("returns no issues when all files present", async () => {
    const entry: LoadedEntry = {
      kind: "skill",
      slug: "tdd",
      absolutePath: join(root, "skills", "tdd", "entry.json"),
      relativePath: "skills/tdd/entry.json",
      dir: join(root, "skills", "tdd"),
      raw: { files: [{ source: "skill.md" }] },
    };
    expect(await checkFileExistence([entry])).toEqual([]);
  });

  it("flags missing source file", async () => {
    const entry: LoadedEntry = {
      kind: "skill",
      slug: "tdd",
      absolutePath: join(root, "skills", "tdd", "entry.json"),
      relativePath: "skills/tdd/entry.json",
      dir: join(root, "skills", "tdd"),
      raw: { files: [{ source: "missing.md" }] },
    };
    const issues = await checkFileExistence([entry]);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.code).toBe("FILE_MISSING");
  });

  it("flags missing snippetFile", async () => {
    const entry: LoadedEntry = {
      kind: "hook",
      slug: "fmt",
      absolutePath: join(root, "hooks", "fmt", "entry.json"),
      relativePath: "hooks/fmt/entry.json",
      dir: join(root, "hooks", "fmt"),
      raw: { snippetFile: "hook.json" },
    };
    const issues = await checkFileExistence([entry]);
    expect(issues).toHaveLength(1);
  });

  it("ignores non-object raw", async () => {
    const entry: LoadedEntry = {
      kind: "skill",
      slug: "x",
      absolutePath: join(root, "skills", "x", "entry.json"),
      relativePath: "skills/x/entry.json",
      dir: join(root, "skills", "x"),
      raw: null,
    };
    expect(await checkFileExistence([entry])).toEqual([]);
  });
});
