import { describe, expect, it } from "vitest";
import { deletePath, getPath, setPath } from "../src/jsonpath.js";

describe("getPath", () => {
  it("returns nested value", () => {
    expect(getPath({ a: { b: { c: 1 } } }, "a.b.c")).toBe(1);
  });

  it("returns undefined for missing path", () => {
    expect(getPath({ a: {} }, "a.b.c")).toBeUndefined();
  });
});

describe("setPath", () => {
  it("sets nested value, creating intermediates", () => {
    const out = setPath({}, "a.b.c", 42);
    expect(out).toEqual({ a: { b: { c: 42 } } });
  });

  it("overwrites existing value", () => {
    const out = setPath({ a: { b: 1 } }, "a.b", 2);
    expect(out).toEqual({ a: { b: 2 } });
  });

  it("does not mutate input", () => {
    const input = { a: { b: 1 } };
    setPath(input, "a.c", 2);
    expect(input).toEqual({ a: { b: 1 } });
  });

  it("replaces non-object intermediates with fresh objects", () => {
    const out = setPath({ a: 1 }, "a.b", 2);
    expect(out).toEqual({ a: { b: 2 } });
  });
});

describe("deletePath", () => {
  it("removes leaf", () => {
    const out = deletePath({ a: { b: 1, c: 2 } }, "a.b");
    expect(out).toEqual({ a: { c: 2 } });
  });

  it("prunes empty parent", () => {
    const out = deletePath({ a: { b: 1 }, z: 9 }, "a.b");
    expect(out).toEqual({ z: 9 });
  });

  it("does nothing for missing path", () => {
    expect(deletePath({ a: 1 }, "b.c")).toEqual({ a: 1 });
  });
});
