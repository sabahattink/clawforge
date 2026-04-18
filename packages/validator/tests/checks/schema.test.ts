import { describe, expect, it } from "vitest";
import { checkSchema, type LoadedEntry } from "../../src/checks/schema.js";

const valid: LoadedEntry = {
  kind: "skill",
  slug: "tdd",
  absolutePath: "/abs/skills/tdd/entry.json",
  relativePath: "skills/tdd/entry.json",
  dir: "/abs/skills/tdd",
  raw: {
    kind: "skill",
    name: "tdd",
    displayName: "TDD",
    description: "Write tests first.",
    author: { name: "K", github: "kalkan" },
    tags: [],
    category: "testing",
    version: "1.0.0",
    license: "MIT",
    verified: false,
    createdAt: "2026-04-18T00:00:00.000Z",
    updatedAt: "2026-04-18T00:00:00.000Z",
    sourceCommit: "a".repeat(40),
    sha256: "b".repeat(64),
    files: [{ source: "skill.md", target: "{{CLAUDE_DIR}}/skills/{{name}}/SKILL.md" }],
  },
};

describe("checkSchema", () => {
  it("returns no issues for a valid entry", () => {
    expect(checkSchema([valid])).toEqual([]);
  });

  it("returns a BLOCK issue for an invalid entry", () => {
    const invalid: LoadedEntry = {
      ...valid,
      raw: { ...(valid.raw as Record<string, unknown>), kind: "skill", files: [] },
    };
    const issues = checkSchema([invalid]);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.severity).toBe("BLOCK");
    expect(issues[0]?.code).toBe("ENTRY_INVALID");
  });
});
