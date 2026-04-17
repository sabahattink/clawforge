import { describe, expect, it } from "vitest";
import { PresetEntrySchema } from "../src/preset.js";
import { base } from "./fixtures/index.js";

describe("PresetEntrySchema", () => {
  const validPreset = {
    ...base(),
    name: "strict-tdd",
    kind: "preset" as const,
    includes: ["skill:tdd-workflow", "agent:code-reviewer"],
  };

  it("accepts a valid preset", () => {
    const parsed = PresetEntrySchema.parse(validPreset);
    expect(parsed.includes).toHaveLength(2);
  });

  it("accepts optional settingsPatch filename", () => {
    const parsed = PresetEntrySchema.parse({
      ...validPreset,
      settingsPatch: "preset.json",
    });
    expect(parsed.settingsPatch).toBe("preset.json");
  });

  it("rejects empty includes", () => {
    const result = PresetEntrySchema.safeParse({ ...validPreset, includes: [] });
    expect(result.success).toBe(false);
  });

  it("rejects includes with malformed ids", () => {
    const result = PresetEntrySchema.safeParse({
      ...validPreset,
      includes: ["skill:Bad_Name"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate ids in includes", () => {
    const result = PresetEntrySchema.safeParse({
      ...validPreset,
      includes: ["skill:tdd-workflow", "skill:tdd-workflow"],
    });
    expect(result.success).toBe(false);
  });

  // Note: the "preset including itself" check is enforced at the union level
  // (`EntrySchema` in src/entry.ts) via `superRefine`, not here. Keeping
  // `PresetEntrySchema` as a pure `ZodObject` is required by `z.discriminatedUnion`.
});
