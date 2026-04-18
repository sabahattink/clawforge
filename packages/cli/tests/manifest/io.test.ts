import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  readManifest,
  removeById,
  upsert,
  writeManifest,
} from "../../src/manifest/io.js";
import { emptyManifest, type InstalledRecord } from "../../src/manifest/types.js";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "clawmart-manifest-"));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const rec = (id: string, version = "1.0.0"): InstalledRecord => ({
  id,
  version,
  installedAt: "2026-04-19T00:00:00.000Z",
  source: `https://cdn.clawmart.dev/${id}.json`,
  sourceCommit: "a".repeat(40),
  verifiedAtInstall: false,
  files: [],
  jsonMerges: [],
  sha256: "b".repeat(64),
});

describe("readManifest", () => {
  it("returns empty skeleton when file is missing", async () => {
    const m = await readManifest(join(dir, "missing.json"), {
      scope: "global",
      claudeDir: "/home/u/.claude",
    });
    expect(m.installed).toEqual([]);
    expect(m.scope).toBe("global");
  });

  it("round-trips via writeManifest", async () => {
    const path = join(dir, ".clawmart", "manifest.json");
    const m = emptyManifest("project", "/proj/.claude");
    m.installed.push(rec("skill:a"));
    await writeManifest(path, m);
    const read = await readManifest(path, {
      scope: "project",
      claudeDir: "/proj/.claude",
    });
    expect(read.installed).toHaveLength(1);
    expect(read.installed[0]?.id).toBe("skill:a");
  });
});

describe("upsert", () => {
  it("adds when id does not exist", () => {
    const m = emptyManifest("global", "/x");
    const updated = upsert(m, rec("skill:a"));
    expect(updated.installed).toHaveLength(1);
  });

  it("replaces when id exists", () => {
    const m = emptyManifest("global", "/x");
    const a = upsert(m, rec("skill:a", "1.0.0"));
    const b = upsert(a, rec("skill:a", "1.1.0"));
    expect(b.installed).toHaveLength(1);
    expect(b.installed[0]?.version).toBe("1.1.0");
  });
});

describe("removeById", () => {
  it("returns the removed record", () => {
    const m = upsert(emptyManifest("global", "/x"), rec("skill:a"));
    const { manifest, removed } = removeById(m, "skill:a");
    expect(removed?.id).toBe("skill:a");
    expect(manifest.installed).toEqual([]);
  });

  it("returns null if missing", () => {
    const { removed } = removeById(emptyManifest("global", "/x"), "skill:x");
    expect(removed).toBeNull();
  });
});
