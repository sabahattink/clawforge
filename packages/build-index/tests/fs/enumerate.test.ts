import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { enumerateEntries } from "../../src/fs/enumerate.js";

let root: string;
beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "clawmart-enum-"));
  mkdirSync(join(root, "skills", "tdd"), { recursive: true });
  writeFileSync(join(root, "skills", "tdd", "entry.json"), "{}", "utf8");
  mkdirSync(join(root, "agents", "code-reviewer"), { recursive: true });
  writeFileSync(join(root, "agents", "code-reviewer", "entry.json"), "{}", "utf8");
  writeFileSync(join(root, "_verified.json"), "{}", "utf8");
  writeFileSync(join(root, "README.md"), "", "utf8");
  mkdirSync(join(root, "unknowns", "foo"), { recursive: true });
  writeFileSync(join(root, "unknowns", "foo", "entry.json"), "{}", "utf8");
});
afterAll(() => rmSync(root, { recursive: true, force: true }));

describe("enumerateEntries", () => {
  it("finds only <kind>/<slug>/entry.json files", async () => {
    const list = await enumerateEntries(root);
    const rel = list.map((p) => p.relativePath).sort();
    expect(rel).toEqual(["agents/code-reviewer/entry.json", "skills/tdd/entry.json"]);
  });

  it("returns kind and slug parsed from path", async () => {
    const list = await enumerateEntries(root);
    const tdd = list.find((p) => p.slug === "tdd");
    expect(tdd?.kind).toBe("skill");
  });

  it("skips entry.json when parent dir is not a known kind dir", async () => {
    const list = await enumerateEntries(root);
    expect(list.find((p) => p.slug === "foo")).toBeUndefined();
  });

  it("returns empty list for non-existent root", async () => {
    const list = await enumerateEntries(join(root, "does-not-exist"));
    expect(list).toEqual([]);
  });

  it("skips files at kind-dir level (entries must be directories)", async () => {
    writeFileSync(join(root, "skills", "not-a-dir.txt"), "", "utf8");
    const list = await enumerateEntries(root);
    expect(list.find((p) => p.slug === "not-a-dir.txt")).toBeUndefined();
  });
});
