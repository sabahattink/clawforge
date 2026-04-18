import type { Entry, VerifiedIndex } from "@clawmart/schema";
import { describe, expect, it } from "vitest";
import { applyVerifiedIndex } from "../../src/transform/apply-verified.js";

const e = (name: string, version: string, verified: boolean): Entry =>
  ({
    kind: "skill",
    name,
    displayName: name,
    description: "x",
    author: { name: "a", github: "a" },
    tags: [],
    category: "testing",
    version,
    license: "MIT",
    verified,
    createdAt: "2026-02-01T09:00:00.000Z",
    updatedAt: "2026-04-10T18:00:00.000Z",
    sourceCommit: "a".repeat(40),
    sha256: "b".repeat(64),
    files: [{ source: "skill.md", target: "{{CLAUDE_DIR}}/skills/{{name}}/SKILL.md" }],
  }) as Entry;

const idx: VerifiedIndex = {
  version: 1,
  entries: {
    "skill:tdd": {
      verifiedAt: "2026-04-15T12:00:00.000Z",
      verifiedBy: "kalkan",
      verifiedVersion: "1.2.0",
      reason: "good",
      expiresAt: null,
    },
  },
};

describe("applyVerifiedIndex", () => {
  it("sets verified=true when id+version match", () => {
    const entries = [e("tdd", "1.2.0", false)];
    const result = applyVerifiedIndex(entries, idx);
    expect(result[0]?.verified).toBe(true);
  });

  it("keeps verified=false when version mismatches", () => {
    const entries = [e("tdd", "1.3.0", false)];
    const result = applyVerifiedIndex(entries, idx);
    expect(result[0]?.verified).toBe(false);
  });

  it("keeps verified=false for unknown ids", () => {
    const entries = [e("other", "1.0.0", true)];
    const result = applyVerifiedIndex(entries, idx);
    expect(result[0]?.verified).toBe(false);
  });
});
