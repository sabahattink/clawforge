import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { writeOutputs } from "../../src/fs/write-outputs.js";

let dir: string;
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "clawforge-write-"));
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("writeOutputs", () => {
  it("writes registry.json, per-kind shards, sitemap.xml, feed.xml, tombstones", async () => {
    await writeOutputs({
      distDir: dir,
      registryIndex: {
        version: 1,
        generatedAt: "2026-04-18T12:00:00.000Z",
        count: 0,
        entries: [],
      },
      shards: {
        skill: {
          version: 1,
          generatedAt: "2026-04-18T12:00:00.000Z",
          count: 0,
          entries: [],
        },
      },
      sitemap: "<sitemap/>",
      feed: "<rss/>",
      tombstones: { version: 1, entries: {} },
    });
    expect(JSON.parse(readFileSync(join(dir, "registry.json"), "utf8")).count).toBe(0);
    expect(readFileSync(join(dir, "skills.json"), "utf8")).toContain("generatedAt");
    expect(readFileSync(join(dir, "sitemap.xml"), "utf8")).toBe("<sitemap/>");
    expect(readFileSync(join(dir, "feed.xml"), "utf8")).toBe("<rss/>");
    expect(readFileSync(join(dir, "tombstones.json"), "utf8")).toContain("entries");
  });
});
