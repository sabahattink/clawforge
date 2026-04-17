import { describe, expect, it } from "vitest";
import { McpEntrySchema } from "../src/mcp.js";
import { base } from "./fixtures/index.js";

describe("McpEntrySchema", () => {
  const validMcp = {
    ...base(),
    kind: "mcp" as const,
    snippetFile: "mcp.json",
    mergeTarget: "settings.json" as const,
    mergePath: "mcpServers.{{name}}",
  };

  it("accepts a valid mcp entry", () => {
    const parsed = McpEntrySchema.parse(validMcp);
    expect(parsed.mergePath).toBe("mcpServers.{{name}}");
  });

  it("accepts envVars metadata", () => {
    const parsed = McpEntrySchema.parse({
      ...validMcp,
      envVars: [{ name: "GITHUB_TOKEN", required: true, description: "GitHub API token" }],
    });
    expect(parsed.envVars?.[0]?.name).toBe("GITHUB_TOKEN");
  });

  it("rejects envVars with empty description", () => {
    const result = McpEntrySchema.safeParse({
      ...validMcp,
      envVars: [{ name: "X", required: true, description: "" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects envVars with lowercase name", () => {
    const result = McpEntrySchema.safeParse({
      ...validMcp,
      envVars: [{ name: "github_token", required: true, description: "x" }],
    });
    expect(result.success).toBe(false);
  });
});
