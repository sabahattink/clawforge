import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildIndex } from "../src/build.js";
import type { GitReader } from "../src/git/timestamps.js";

const here = fileURLToPath(new URL(".", import.meta.url));
const fixtureRoot = resolve(here, "fixtures/registry");
let distDir: string;

const fakeGit: GitReader = {
  async firstCommitDate() {
    return "2026-02-01T09:00:00.000Z";
  },
  async lastCommitDate() {
    return "2026-04-10T18:00:00.000Z";
  },
  async lastCommitSha() {
    return "a".repeat(40);
  },
};

beforeAll(() => {
  distDir = mkdtempSync(join(tmpdir(), "clawforge-build-"));
});
afterAll(() => rmSync(distDir, { recursive: true, force: true }));

describe("buildIndex", () => {
  it("produces a RegistryIndex matching the fixture entries", async () => {
    const result = await buildIndex({
      registryRoot: fixtureRoot,
      distDir,
      cdnBase: "https://cdn.clawforge.dev",
      siteBase: "https://clawforge.dev",
      generatedAt: "2026-04-18T12:00:00.000Z",
      git: fakeGit,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.registryIndex.count).toBe(2);
      const ids = result.value.registryIndex.entries.map((e) => e.id).sort();
      expect(ids).toEqual(["agent:code-reviewer", "skill:tdd-workflow"]);
      const skill = result.value.registryIndex.entries.find((e) => e.id === "skill:tdd-workflow");
      expect(skill?.verified).toBe(true);
      expect(result.value.errors).toEqual([]);
    }
  });
});
