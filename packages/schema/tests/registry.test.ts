import { describe, expect, it } from "vitest";
import {
  IndexEntrySchema,
  RegistryIndexSchema,
  RemovedIndexSchema,
  VerifiedIndexSchema,
} from "../src/registry.js";

const validIndexEntry = {
  id: "skill:tdd-workflow",
  kind: "skill",
  name: "tdd-workflow",
  displayName: "TDD Workflow",
  description: "Write tests first.",
  tags: ["testing"],
  category: "testing",
  verified: true,
  version: "1.2.0",
  author: "sabahattink",
  detailUrl: "https://cdn.clawforge.dev/skills/tdd-workflow/entry.json",
  sha256: "a".repeat(64),
  updatedAt: "2026-04-18T12:00:00.000Z",
};

describe("IndexEntrySchema", () => {
  it("accepts a valid lightweight index entry", () => {
    const parsed = IndexEntrySchema.parse(validIndexEntry);
    expect(parsed.id).toBe("skill:tdd-workflow");
  });

  it("rejects id not matching kind", () => {
    const result = IndexEntrySchema.safeParse({ ...validIndexEntry, kind: "agent" });
    expect(result.success).toBe(false);
  });
});

describe("RegistryIndexSchema", () => {
  it("accepts an empty registry", () => {
    const parsed = RegistryIndexSchema.parse({
      version: 1,
      generatedAt: "2026-04-18T12:00:00.000Z",
      count: 0,
      entries: [],
    });
    expect(parsed.count).toBe(0);
  });

  it("rejects count mismatch vs entries length", () => {
    const result = RegistryIndexSchema.safeParse({
      version: 1,
      generatedAt: "2026-04-18T12:00:00.000Z",
      count: 2,
      entries: [validIndexEntry],
    });
    expect(result.success).toBe(false);
  });
});

describe("VerifiedIndexSchema", () => {
  it("accepts a valid verified index", () => {
    const parsed = VerifiedIndexSchema.parse({
      version: 1,
      entries: {
        "skill:tdd-workflow": {
          verifiedAt: "2026-04-15T12:00:00.000Z",
          verifiedBy: "sabahattink",
          verifiedVersion: "1.2.0",
          reason: "High-quality, well-documented.",
          expiresAt: null,
        },
      },
    });
    expect(parsed.entries["skill:tdd-workflow"]?.verifiedBy).toBe("sabahattink");
  });

  it("allows null expiresAt", () => {
    const parsed = VerifiedIndexSchema.parse({
      version: 1,
      entries: {},
    });
    expect(Object.keys(parsed.entries)).toHaveLength(0);
  });
});

describe("RemovedIndexSchema", () => {
  it("accepts a removed entry record", () => {
    const parsed = RemovedIndexSchema.parse({
      version: 1,
      entries: {
        "skill:evil-thing": {
          removedAt: "2026-04-18T12:00:00.000Z",
          reason: "malicious",
          category: "security",
        },
      },
    });
    expect(parsed.entries["skill:evil-thing"]?.category).toBe("security");
  });

  it("rejects unknown category", () => {
    const result = RemovedIndexSchema.safeParse({
      version: 1,
      entries: {
        "skill:x": { removedAt: "2026-04-18T12:00:00.000Z", reason: "x", category: "other" },
      },
    });
    expect(result.success).toBe(false);
  });
});
