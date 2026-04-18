import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Entry, IndexEntry, RegistryIndex } from "@clawmart/schema";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addCommand } from "../src/commands/add.js";
import { listCommand } from "../src/commands/list.js";
import { removeCommand } from "../src/commands/remove.js";
import type { RegistryClient } from "../src/registry/client.js";

let home: string;
let downloadDir: string;
const skillBody = "# TDD workflow\n\nWrite tests first.\n";

const indexEntry: IndexEntry = {
  id: "skill:tdd-workflow",
  kind: "skill",
  name: "tdd-workflow",
  displayName: "TDD Workflow",
  description: "Write tests first.",
  tags: ["tdd"],
  category: "testing",
  verified: true,
  version: "1.0.0",
  author: "kalkan",
  detailUrl: "https://cdn.test/skills/tdd-workflow/entry.json",
  sha256: "a".repeat(64),
  updatedAt: "2026-04-19T00:00:00.000Z",
};

const fullEntry: Entry = {
  kind: "skill",
  name: "tdd-workflow",
  displayName: "TDD Workflow",
  description: "Write tests first.",
  author: { name: "K", github: "kalkan" },
  tags: ["tdd"],
  category: "testing",
  version: "1.0.0",
  license: "MIT",
  verified: true,
  createdAt: "2026-04-19T00:00:00.000Z",
  updatedAt: "2026-04-19T00:00:00.000Z",
  sourceCommit: "a".repeat(40),
  sha256: "a".repeat(64),
  files: [{ source: "skill.md", target: "{{CLAUDE_DIR}}/skills/{{name}}/SKILL.md" }],
};

const index: RegistryIndex = {
  version: 1,
  generatedAt: "2026-04-19T00:00:00.000Z",
  count: 1,
  entries: [indexEntry],
};

const client: RegistryClient = {
  async fetchIndex() {
    return index;
  },
  async fetchEntry() {
    return fullEntry;
  },
  async fetchFile() {
    return Buffer.from(skillBody, "utf8");
  },
};

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), "clawmart-e2e-home-"));
  downloadDir = mkdtempSync(join(tmpdir(), "clawmart-e2e-dl-"));
});
afterEach(() => {
  rmSync(home, { recursive: true, force: true });
  rmSync(downloadDir, { recursive: true, force: true });
});

describe("e2e: add → list → remove", () => {
  it("installs a skill, tracks in manifest, then removes cleanly", async () => {
    const onPrompt = vi.fn().mockResolvedValue("skip");

    const result = await addCommand({
      id: "skill:tdd-workflow",
      client,
      scope: "global",
      home,
      track: true,
      force: false,
      dryRun: false,
      onPrompt,
      downloadDir,
    });

    expect(result.files).toHaveLength(1);
    expect(result.tracked).toBe(true);
    const targetFile = join(home, ".claude", "skills", "tdd-workflow", "SKILL.md");
    expect(existsSync(targetFile)).toBe(true);
    expect(readFileSync(targetFile, "utf8")).toBe(skillBody);

    const listed = await listCommand({ scope: "global", home });
    expect(listed).toHaveLength(1);
    expect(listed[0]?.id).toBe("skill:tdd-workflow");

    const removeResult = await removeCommand({
      id: "skill:tdd-workflow",
      scope: "global",
      home,
      dryRun: false,
    });
    expect(removeResult.found).toBe(true);
    expect(removeResult.filesRemoved).toHaveLength(1);
    // After remove, the target file should no longer exist regardless of exact path spelling.
    expect(existsSync(targetFile)).toBe(false);

    const finalList = await listCommand({ scope: "global", home });
    expect(finalList).toEqual([]);
  });

  it("throws a clear error when the id is not in the index", async () => {
    await expect(
      addCommand({
        id: "skill:missing",
        client,
        scope: "global",
        home,
        track: false,
        force: false,
        dryRun: false,
        onPrompt: vi.fn(),
        downloadDir,
      }),
    ).rejects.toThrow(/not found/);
  });
});
