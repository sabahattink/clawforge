import { describe, expect, it } from "vitest";
import { HookEntrySchema } from "../src/hook.js";
import { base } from "./fixtures/index.js";

describe("HookEntrySchema", () => {
  const validHook = {
    ...base(),
    kind: "hook" as const,
    snippetFile: "hook.json",
    mergeTarget: "settings.json" as const,
    mergePath: "hooks.PostToolUse",
    strategy: "append" as const,
  };

  it("accepts a valid hook entry", () => {
    const parsed = HookEntrySchema.parse(validHook);
    expect(parsed.strategy).toBe("append");
  });

  it("rejects unknown mergeTarget", () => {
    const result = HookEntrySchema.safeParse({
      ...validHook,
      mergeTarget: "other.json",
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown strategy", () => {
    const result = HookEntrySchema.safeParse({ ...validHook, strategy: "overwrite" });
    expect(result.success).toBe(false);
  });

  it("rejects mergePath with dangerous keys", () => {
    const result = HookEntrySchema.safeParse({
      ...validHook,
      mergePath: "hooks.PostToolUse..",
    });
    expect(result.success).toBe(false);
  });
});
