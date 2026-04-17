import { describe, expect, it } from "vitest";
import { CommandEntrySchema } from "../src/command.js";
import { base } from "./fixtures/index.js";

describe("CommandEntrySchema", () => {
  const validCmd = {
    ...base(),
    kind: "cmd" as const,
    files: [{ source: "command.md", target: "{{CLAUDE_DIR}}/commands/{{name}}.md" }],
    invocation: "/code-review",
  };

  it("accepts a valid command entry", () => {
    const parsed = CommandEntrySchema.parse(validCmd);
    expect(parsed.invocation).toBe("/code-review");
  });

  it("rejects invocation without leading slash", () => {
    const result = CommandEntrySchema.safeParse({ ...validCmd, invocation: "code-review" });
    expect(result.success).toBe(false);
  });

  it("rejects invocation with spaces", () => {
    const result = CommandEntrySchema.safeParse({ ...validCmd, invocation: "/code review" });
    expect(result.success).toBe(false);
  });
});
