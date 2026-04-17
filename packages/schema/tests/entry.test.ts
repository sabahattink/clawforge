import { describe, expect, it } from "vitest";
import { EntrySchema, parseEntry } from "../src/entry.js";
import { base } from "./fixtures/index.js";

describe("EntrySchema (discriminated union)", () => {
  it("parses a skill entry", () => {
    const parsed = EntrySchema.parse({
      ...base(),
      kind: "skill",
      files: [{ source: "skill.md", target: "{{CLAUDE_DIR}}/skills/{{name}}/SKILL.md" }],
    });
    expect(parsed.kind).toBe("skill");
  });

  it("parses a preset entry", () => {
    const parsed = EntrySchema.parse({
      ...base(),
      name: "strict-tdd",
      kind: "preset",
      includes: ["skill:tdd-workflow"],
    });
    expect(parsed.kind).toBe("preset");
  });

  it("rejects entries without a kind discriminator", () => {
    const result = EntrySchema.safeParse({ ...base() });
    expect(result.success).toBe(false);
  });

  it("rejects a preset that includes itself (union-level superRefine)", () => {
    const result = EntrySchema.safeParse({
      ...base(),
      name: "strict-tdd",
      kind: "preset",
      includes: ["preset:strict-tdd"],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("includes"))).toBe(true);
    }
  });
});

describe("parseEntry", () => {
  it("returns the parsed entry on success", () => {
    const entry = parseEntry({
      ...base(),
      kind: "agent",
      files: [{ source: "agent.md", target: "{{CLAUDE_DIR}}/agents/{{name}}.md" }],
    });
    expect(entry.kind).toBe("agent");
  });

  it("throws a formatted error listing every issue", () => {
    try {
      parseEntry({ ...base(), kind: "skill" });
      throw new Error("should have thrown");
    } catch (err) {
      const message = (err as Error).message;
      expect(message).toMatch(/files/);
      expect(message).toMatch(/entry validation failed/i);
    }
  });
});
