import { describe, expect, it } from "vitest";
import { AuthorSchema, BaseEntrySchema } from "../src/common.js";

const validBase = {
  name: "tdd-workflow",
  displayName: "TDD Workflow",
  description: "Write tests first, enforce red-green-refactor discipline.",
  author: {
    name: "Sabahattin Kalkan",
    github: "kalkan",
  },
  tags: ["testing", "tdd"],
  category: "testing",
  version: "1.2.0",
  license: "MIT",
  verified: false,
  createdAt: "2026-04-18T12:00:00.000Z",
  updatedAt: "2026-04-18T12:00:00.000Z",
  sourceCommit: "a".repeat(40),
  sha256: "b".repeat(64),
};

describe("AuthorSchema", () => {
  it("accepts minimal valid author", () => {
    expect(AuthorSchema.parse({ name: "Ada", github: "ada" })).toEqual({
      name: "Ada",
      github: "ada",
    });
  });

  it("accepts optional url", () => {
    const parsed = AuthorSchema.parse({
      name: "Ada",
      github: "ada",
      url: "https://ada.dev",
    });
    expect(parsed.url).toBe("https://ada.dev");
  });

  it("rejects github handles with @ prefix", () => {
    const result = AuthorSchema.safeParse({ name: "Ada", github: "@ada" });
    expect(result.success).toBe(false);
  });

  it("rejects non-http urls", () => {
    const result = AuthorSchema.safeParse({
      name: "Ada",
      github: "ada",
      url: "javascript:alert(1)",
    });
    expect(result.success).toBe(false);
  });
});

describe("BaseEntrySchema", () => {
  it("accepts a valid entry (no kind — BaseEntry is pre-discriminator)", () => {
    const parsed = BaseEntrySchema.parse(validBase);
    expect(parsed.name).toBe("tdd-workflow");
    expect(parsed.verified).toBe(false);
  });

  it("rejects name with uppercase letters", () => {
    const result = BaseEntrySchema.safeParse({ ...validBase, name: "TDD" });
    expect(result.success).toBe(false);
  });

  it("rejects description over 160 chars", () => {
    const result = BaseEntrySchema.safeParse({
      ...validBase,
      description: "x".repeat(161),
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 5 tags", () => {
    const result = BaseEntrySchema.safeParse({
      ...validBase,
      tags: ["a", "b", "c", "d", "e", "f"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-semver version", () => {
    const result = BaseEntrySchema.safeParse({ ...validBase, version: "1.0" });
    expect(result.success).toBe(false);
  });

  it("rejects non-iso createdAt", () => {
    const result = BaseEntrySchema.safeParse({
      ...validBase,
      createdAt: "2026-04-18",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields (requires, conflicts, repository, sourcePR)", () => {
    const parsed = BaseEntrySchema.parse({
      ...validBase,
      requires: ["skill:tdd-guide"],
      conflicts: ["skill:bdd-workflow"],
      repository: { type: "git", url: "https://github.com/kalkan/tdd" },
      sourcePR: "https://github.com/kalkan/clawmart/pull/1",
      claudeCodeVersion: ">=2.0.0",
    });
    expect(parsed.requires).toEqual(["skill:tdd-guide"]);
  });
});
