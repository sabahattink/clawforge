import { describe, expect, it } from "vitest";
import { AgentEntrySchema } from "../src/agent.js";
import { base } from "./fixtures/index.js";

describe("AgentEntrySchema", () => {
  const validAgent = {
    ...base(),
    kind: "agent" as const,
    files: [{ source: "agent.md", target: "{{CLAUDE_DIR}}/agents/{{name}}.md" }],
  };

  it("accepts a minimal agent entry", () => {
    const parsed = AgentEntrySchema.parse(validAgent);
    expect(parsed.kind).toBe("agent");
  });

  it("accepts tools and model", () => {
    const parsed = AgentEntrySchema.parse({
      ...validAgent,
      tools: ["Read", "Edit", "Bash"],
      model: "sonnet",
    });
    expect(parsed.tools).toEqual(["Read", "Edit", "Bash"]);
    expect(parsed.model).toBe("sonnet");
  });

  it("rejects unknown model", () => {
    const result = AgentEntrySchema.safeParse({ ...validAgent, model: "gpt-4" });
    expect(result.success).toBe(false);
  });

  it("rejects empty tools array", () => {
    const result = AgentEntrySchema.safeParse({ ...validAgent, tools: [] });
    expect(result.success).toBe(false);
  });
});
