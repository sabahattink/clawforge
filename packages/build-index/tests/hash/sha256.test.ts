import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { computeContentSha256 } from "../../src/hash/sha256.js";

let dir: string;
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "clawmart-sha-"));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "a.md"), "hello", "utf8");
  writeFileSync(join(dir, "b.md"), "world", "utf8");
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("computeContentSha256", () => {
  it("hashes a single file deterministically", async () => {
    const h1 = await computeContentSha256(dir, ["a.md"]);
    const h2 = await computeContentSha256(dir, ["a.md"]);
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[a-f0-9]{64}$/);
  });

  it("order of files matters", async () => {
    const ab = await computeContentSha256(dir, ["a.md", "b.md"]);
    const ba = await computeContentSha256(dir, ["b.md", "a.md"]);
    expect(ab).not.toBe(ba);
  });
});
