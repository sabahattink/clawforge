import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { HookEntry } from "@clawforge/schema";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installMerge } from "../../src/installers/merge.js";
import type { InstallerContext } from "../../src/installers/types.js";

let entryDir: string;
let claudeDir: string;

const hook = (): HookEntry => ({
  kind: "hook",
  name: "auto-fmt",
  displayName: "Auto Format",
  description: "Format on save.",
  author: { name: "K", github: "sabahattink" },
  tags: [],
  category: "devops",
  version: "1.0.0",
  license: "MIT",
  verified: false,
  createdAt: "2026-04-19T00:00:00.000Z",
  updatedAt: "2026-04-19T00:00:00.000Z",
  sourceCommit: "a".repeat(40),
  sha256: "b".repeat(64),
  snippetFile: "hook.json",
  mergeTarget: "settings.json",
  mergePath: "hooks.PostToolUse",
  strategy: "append",
});

beforeEach(() => {
  entryDir = mkdtempSync(join(tmpdir(), "clawforge-mergesrc-"));
  claudeDir = mkdtempSync(join(tmpdir(), "clawforge-mergeclaude-"));
  writeFileSync(
    join(entryDir, "hook.json"),
    JSON.stringify({ matcher: "Write", command: "biome" }),
    "utf8",
  );
});
afterEach(() => {
  rmSync(entryDir, { recursive: true, force: true });
  rmSync(claudeDir, { recursive: true, force: true });
});

const ctx = (overrides: Partial<InstallerContext> = {}): InstallerContext => ({
  entry: hook(),
  entryDir,
  claudeDir,
  dryRun: false,
  force: false,
  onPrompt: vi.fn().mockResolvedValue("replace"),
  ...overrides,
});

describe("installMerge (hook append)", () => {
  it("appends into empty settings.json", async () => {
    const result = await installMerge(ctx());
    expect(result.jsonMerges).toHaveLength(1);
    const written = JSON.parse(readFileSync(join(claudeDir, "settings.json"), "utf8"));
    expect(written.hooks.PostToolUse).toHaveLength(1);
  });

  it("appends into existing array", async () => {
    writeFileSync(
      join(claudeDir, "settings.json"),
      JSON.stringify({ hooks: { PostToolUse: [{ matcher: "Read", command: "x" }] } }),
      "utf8",
    );
    await installMerge(ctx());
    const written = JSON.parse(readFileSync(join(claudeDir, "settings.json"), "utf8"));
    expect(written.hooks.PostToolUse).toHaveLength(2);
  });

  it("records before snapshot for reversibility", async () => {
    writeFileSync(
      join(claudeDir, "settings.json"),
      JSON.stringify({ hooks: { PostToolUse: ["existing"] } }),
      "utf8",
    );
    const result = await installMerge(ctx());
    expect(result.jsonMerges[0]?.before).toEqual(["existing"]);
  });

  it("dry-run plans merge but does not write", async () => {
    const result = await installMerge(ctx({ dryRun: true }));
    expect(result.jsonMerges).toHaveLength(1);
    expect(() => readFileSync(join(claudeDir, "settings.json"), "utf8")).toThrow();
  });
});
