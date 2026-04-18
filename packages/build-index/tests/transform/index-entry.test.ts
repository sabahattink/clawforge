import type { Entry } from "@clawmart/schema";
import { describe, expect, it } from "vitest";
import { toIndexEntry } from "../../src/transform/index-entry.js";

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
    const ix = toIndexEntry(skill, "https://cdn.clawmart.dev");
    expect(ix.id).toBe("skill:tdd-workflow");
    expect(ix.detailUrl).toBe("https://cdn.clawmart.dev/skills/tdd-workflow/entry.json");
    expect(ix.author).toBe("kalkan");
    expect(ix.verified).toBe(true);
  });

  it("strips trailing slashes from cdnBase", () => {
    const ix = toIndexEntry(skill, "https://cdn.clawmart.dev/");
    expect(ix.detailUrl).toBe("https://cdn.clawmart.dev/skills/tdd-workflow/entry.json");
  });

  it("maps each kind to its registry directory", () => {
    const agent: Entry = { ...skill, kind: "agent" } as Entry;
    expect(toIndexEntry(agent, "https://x").detailUrl).toContain("/agents/");
    const cmd: Entry = { ...skill, kind: "cmd", invocation: "/x" } as Entry;
    expect(toIndexEntry(cmd, "https://x").detailUrl).toContain("/commands/");
    const hook: Entry = {
      ...skill,
      kind: "hook",
      snippetFile: "hook.json",
      mergeTarget: "settings.json",
      mergePath: "hooks.PostToolUse",
      strategy: "append",
    } as unknown as Entry;
    expect(toIndexEntry(hook, "https://x").detailUrl).toContain("/hooks/");
    const mcp: Entry = {
      ...skill,
      kind: "mcp",
      snippetFile: "mcp.json",
      mergeTarget: "settings.json",
      mergePath: "mcpServers.x",
    } as unknown as Entry;
    expect(toIndexEntry(mcp, "https://x").detailUrl).toContain("/mcp-servers/");
    const preset: Entry = {
      ...skill,
      kind: "preset",
      includes: ["skill:a"],
    } as unknown as Entry;
    expect(toIndexEntry(preset, "https://x").detailUrl).toContain("/presets/");
  });
});
