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
