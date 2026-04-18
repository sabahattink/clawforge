import type { Entry, RemovedIndex } from "@clawforge/schema";
import { describe, expect, it } from "vitest";
import { filterRemoved } from "../../src/transform/filter-removed.js";

const mkEntry = (name: string): Entry =>
  ({
    kind: "skill",
    name,
    displayName: name,
    description: "x",
    author: { name: "a", github: "a" },
    tags: [],
    category: "testing",
    version: "1.0.0",
    license: "MIT",
    verified: false,
    createdAt: "2026-02-01T09:00:00.000Z",
    updatedAt: "2026-04-10T18:00:00.000Z",
    sourceCommit: "a".repeat(40),
    sha256: "b".repeat(64),
    files: [{ source: "skill.md", target: "{{CLAUDE_DIR}}/skills/{{name}}/SKILL.md" }],
  }) as Entry;

const removed: RemovedIndex = {
  version: 1,
  entries: {
    "skill:evil": {
      removedAt: "2026-04-18T00:00:00.000Z",
      reason: "bad",
      category: "malicious",
    },
  },
};

describe("filterRemoved", () => {
  it("excludes entries listed in _removed.json", () => {
    const out = filterRemoved([mkEntry("good"), mkEntry("evil")], removed);
    expect(out.map((e) => e.name)).toEqual(["good"]);
  });
});
