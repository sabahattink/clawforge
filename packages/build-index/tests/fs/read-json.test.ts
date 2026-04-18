import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { readJson } from "../../src/fs/read-json.js";
import { isErr, isOk } from "../../src/types.js";

let dir: string;
beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "clawforge-readjson-"));
  writeFileSync(join(dir, "good.json"), '{"a":1}', "utf8");
  writeFileSync(join(dir, "bad.json"), "{not json}", "utf8");
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("readJson", () => {
  it("returns ok for valid JSON", async () => {
    const r = await readJson<{ a: number }>(join(dir, "good.json"));
    expect(isOk(r)).toBe(true);
    if (isOk(r)) expect(r.value.a).toBe(1);
  });

  it("returns err with IO_READ for missing file", async () => {
    const r = await readJson(join(dir, "missing.json"));
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe("IO_READ");
  });

  it("returns err with JSON_PARSE for malformed JSON", async () => {
    const r = await readJson(join(dir, "bad.json"));
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe("JSON_PARSE");
  });
});
