import { describe, expect, it } from "vitest";
import { type BuildError, isErr, isOk, type Result } from "../src/types.js";

describe("Result helpers", () => {
  it("isOk narrows to success", () => {
    const r: Result<number> = { ok: true, value: 42 };
    expect(isOk(r)).toBe(true);
    if (isOk(r)) {
      const n: number = r.value;
      expect(n).toBe(42);
    }
  });

  it("isErr narrows to failure", () => {
    const err: BuildError = { code: "X", message: "x" };
    const r: Result<number> = { ok: false, error: err };
    expect(isErr(r)).toBe(true);
    if (isErr(r)) {
      expect(r.error.code).toBe("X");
    }
  });
});
