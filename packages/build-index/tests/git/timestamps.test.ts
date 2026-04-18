import { describe, expect, it } from "vitest";
import { type GitReader, resolveTimestamps } from "../../src/git/timestamps.js";

const fixedGit: GitReader = {
  async firstCommitDate(path) {
    return path.endsWith("skills/tdd/entry.json") ? "2026-02-01T09:00:00.000Z" : null;
  },
  async lastCommitDate(path) {
    return path.endsWith("skills/tdd/entry.json") ? "2026-04-10T18:00:00.000Z" : null;
  },
  async lastCommitSha() {
    return "a1b2c3d4e5f6";
  },
};

describe("resolveTimestamps", () => {
  it("returns createdAt, updatedAt and sourceCommit for a known file", async () => {
    const r = await resolveTimestamps(fixedGit, "registry/skills/tdd/entry.json");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.createdAt).toBe("2026-02-01T09:00:00.000Z");
      expect(r.value.updatedAt).toBe("2026-04-10T18:00:00.000Z");
      expect(r.value.sourceCommit).toBe("a1b2c3d4e5f6");
    }
  });

  it("returns err if no commit history is found", async () => {
    const r = await resolveTimestamps(fixedGit, "registry/skills/missing/entry.json");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("GIT_NO_HISTORY");
  });
});
