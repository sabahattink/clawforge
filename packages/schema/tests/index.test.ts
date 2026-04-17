import { describe, expect, it } from "vitest";
import * as api from "../src/index.js";

describe("public API", () => {
  it("exports every schema", () => {
    const required = [
      "KINDS",
      "KindSchema",
      "AuthorSchema",
      "BaseEntrySchema",
      "IdReferenceSchema",
      "SkillEntrySchema",
      "AgentEntrySchema",
      "CommandEntrySchema",
      "HookEntrySchema",
      "McpEntrySchema",
      "PresetEntrySchema",
      "EntrySchema",
      "parseEntry",
      "parseId",
      "formatId",
      "IndexEntrySchema",
      "RegistryIndexSchema",
      "VerifiedIndexSchema",
      "RemovedIndexSchema",
      "RECOMMENDED_CATEGORIES",
    ];
    for (const name of required) {
      expect(api).toHaveProperty(name);
    }
  });
});
