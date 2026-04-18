import { describe, expect, it } from "vitest";
import { sha256Of, verifyOrThrow } from "../src/hash.js";

describe("sha256Of", () => {
  it("produces 64-char hex for known input", () => {
    const h = sha256Of([Buffer.from("hello")]);
    expect(h).toMatch(/^[a-f0-9]{64}$/);
  });

  it("is deterministic across calls", () => {
    expect(sha256Of([Buffer.from("a")])).toBe(sha256Of([Buffer.from("a")]));
  });

  it("is order-sensitive", () => {
    const ab = sha256Of([Buffer.from("a"), Buffer.from("b")]);
    const ba = sha256Of([Buffer.from("b"), Buffer.from("a")]);
    expect(ab).not.toBe(ba);
  });
});

describe("verifyOrThrow", () => {
  it("returns silently when hashes match", () => {
    expect(() => verifyOrThrow("a".repeat(64), "a".repeat(64))).not.toThrow();
  });

  it("throws on mismatch", () => {
    expect(() => verifyOrThrow("a".repeat(64), "b".repeat(64))).toThrow(/sha256 mismatch/);
  });
});
