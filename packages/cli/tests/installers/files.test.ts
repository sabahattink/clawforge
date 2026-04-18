import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { SkillEntry } from "@clawforge/schema";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installFiles } from "../../src/installers/files.js";
import type { InstallerContext } from "../../src/installers/types.js";

let entryDir: string;
let claudeDir: string;

const skill = (): SkillEntry => ({
  kind: "skill",
  name: "tdd",
  displayName: "TDD",
  description: "Tests first.",
  author: { name: "K", github: "sabahattink" },
  tags: [],
  category: "testing",
  version: "1.0.0",
  license: "MIT",
  verified: false,
  createdAt: "2026-04-19T00:00:00.000Z",
  updatedAt: "2026-04-19T00:00:00.000Z",
  sourceCommit: "a".repeat(40),
  sha256: "b".repeat(64),
  files: [{ source: "skill.md", target: "{{CLAUDE_DIR}}/skills/{{name}}/SKILL.md" }],
});

beforeEach(() => {
  entryDir = mkdtempSync(join(tmpdir(), "clawforge-src-"));
  claudeDir = mkdtempSync(join(tmpdir(), "clawforge-claude-"));
  writeFileSync(join(entryDir, "skill.md"), "skill body v1", "utf8");
});
afterEach(() => {
  rmSync(entryDir, { recursive: true, force: true });
  rmSync(claudeDir, { recursive: true, force: true });
});

const ctx = (overrides: Partial<InstallerContext> = {}): InstallerContext => ({
  entry: skill(),
  entryDir,
  claudeDir,
  dryRun: false,
  force: false,
  onPrompt: vi.fn().mockResolvedValue("skip"),
  ...overrides,
});

describe("installFiles", () => {
  it("writes the target file on clean install", async () => {
    const result = await installFiles(ctx());
    expect(result.files).toHaveLength(1);
    const target = join(claudeDir, "skills", "tdd", "SKILL.md");
    expect(readFileSync(target, "utf8")).toBe("skill body v1");
  });

  it("skips identical existing files silently", async () => {
    mkdirSync(join(claudeDir, "skills", "tdd"), { recursive: true });
    writeFileSync(join(claudeDir, "skills", "tdd", "SKILL.md"), "skill body v1", "utf8");
    const result = await installFiles(ctx());
    expect(result.files).toHaveLength(0);
  });

  it("overwrites when --force on differing content", async () => {
    mkdirSync(join(claudeDir, "skills", "tdd"), { recursive: true });
    writeFileSync(join(claudeDir, "skills", "tdd", "SKILL.md"), "old", "utf8");
    const result = await installFiles(ctx({ force: true }));
    expect(result.files).toHaveLength(1);
    expect(readFileSync(join(claudeDir, "skills", "tdd", "SKILL.md"), "utf8")).toBe(
      "skill body v1",
    );
  });

  it("prompts on conflict, honors skip", async () => {
    mkdirSync(join(claudeDir, "skills", "tdd"), { recursive: true });
    writeFileSync(join(claudeDir, "skills", "tdd", "SKILL.md"), "old", "utf8");
    const onPrompt = vi.fn().mockResolvedValue("skip");
    const result = await installFiles(ctx({ onPrompt }));
    expect(onPrompt).toHaveBeenCalledOnce();
    expect(result.files).toHaveLength(0);
    expect(readFileSync(join(claudeDir, "skills", "tdd", "SKILL.md"), "utf8")).toBe("old");
  });

  it("dry-run reports planned writes, does nothing", async () => {
    const result = await installFiles(ctx({ dryRun: true }));
    expect(result.files).toHaveLength(1);
    expect(() => readFileSync(join(claudeDir, "skills", "tdd", "SKILL.md"), "utf8")).toThrow();
  });
});
