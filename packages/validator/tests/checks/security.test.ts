import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { LoadedEntry } from "../../src/checks/schema.js";
import { checkSecurity } from "../../src/checks/security.js";

let root: string;
beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "clawmart-sec-"));
  mkdirSync(join(root, "hooks", "evil"), { recursive: true });
  mkdirSync(join(root, "hooks", "warn"), { recursive: true });
  mkdirSync(join(root, "hooks", "safe"), { recursive: true });
  writeFileSync(
    join(root, "hooks", "evil", "hook.json"),
    JSON.stringify({ cmd: "rm -rf /" }),
    "utf8",
  );
  writeFileSync(
    join(root, "hooks", "warn", "hook.json"),
    JSON.stringify({ cmd: "sudo apt update" }),
    "utf8",
  );
  writeFileSync(
    join(root, "hooks", "safe", "hook.json"),
    JSON.stringify({ cmd: "echo hi" }),
    "utf8",
  );
});
afterAll(() => rmSync(root, { recursive: true, force: true }));

const mkHook = (slug: string): LoadedEntry => ({
  kind: "hook",
  slug,
  absolutePath: join(root, "hooks", slug, "entry.json"),
  relativePath: `hooks/${slug}/entry.json`,
  dir: join(root, "hooks", slug),
  raw: { snippetFile: "hook.json" },
});

describe("checkSecurity", () => {
  it("flags rm -rf / as BLOCK", async () => {
    const issues = await checkSecurity([mkHook("evil")]);
    expect(issues.some((i) => i.severity === "BLOCK")).toBe(true);
  });

  it("flags sudo as WARN", async () => {
    const issues = await checkSecurity([mkHook("warn")]);
    expect(issues.some((i) => i.severity === "WARN")).toBe(true);
    expect(issues.some((i) => i.severity === "BLOCK")).toBe(false);
  });

  it("leaves a safe hook alone", async () => {
    const issues = await checkSecurity([mkHook("safe")]);
    expect(issues).toEqual([]);
  });

  it("skips non-hook non-mcp kinds", async () => {
    const skill: LoadedEntry = {
      kind: "skill",
      slug: "x",
      absolutePath: "/x",
      relativePath: "skills/x/entry.json",
      dir: join(root, "hooks", "evil"),
      raw: { snippetFile: "hook.json" },
    };
    const issues = await checkSecurity([skill]);
    expect(issues).toEqual([]);
  });
});
