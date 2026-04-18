import { describe, expect, it } from "vitest";
import { formatId, parseId } from "../src/namespace.js";

describe("parseId", () => {
  it("parses a global id", () => {
    expect(parseId("skill:tdd-workflow")).toEqual({
      kind: "skill",
      user: null,
      name: "tdd-workflow",
    });
  });

  it("parses a scoped id", () => {
    expect(parseId("skill:@sabahattink/custom-tdd")).toEqual({
      kind: "skill",
      user: "sabahattink",
      name: "custom-tdd",
    });
  });

  it("throws on missing kind", () => {
    expect(() => parseId(":tdd-workflow")).toThrow(/invalid id/i);
  });

  it("throws on unknown kind", () => {
    expect(() => parseId("plugin:foo")).toThrow(/unknown kind/i);
  });

  it("throws on empty name", () => {
    expect(() => parseId("skill:")).toThrow(/invalid id/i);
  });

  it("throws on malformed scoped id", () => {
    expect(() => parseId("skill:@/foo")).toThrow(/invalid id/i);
    expect(() => parseId("skill:@user")).toThrow(/invalid id/i);
    expect(() => parseId("skill:@user/")).toThrow(/invalid id/i);
  });

  it("throws on name with invalid characters", () => {
    expect(() => parseId("skill:TDD_Workflow")).toThrow(/invalid id/i);
    expect(() => parseId("skill:tdd workflow")).toThrow(/invalid id/i);
  });
});

describe("formatId", () => {
  it("formats a global id", () => {
    expect(formatId({ kind: "skill", user: null, name: "tdd-workflow" })).toBe(
      "skill:tdd-workflow",
    );
  });

  it("formats a scoped id", () => {
    expect(formatId({ kind: "agent", user: "sabahattink", name: "code-reviewer" })).toBe(
      "agent:@sabahattink/code-reviewer",
    );
  });

  it("round-trips every global id", () => {
    const id = "hook:auto-format-ts";
    expect(formatId(parseId(id))).toBe(id);
  });

  it("round-trips every scoped id", () => {
    const id = "mcp:@anthropic/github-mcp";
    expect(formatId(parseId(id))).toBe(id);
  });

  it("throws on invalid slug in name", () => {
    expect(() => formatId({ kind: "skill", user: null, name: "Bad_Name" })).toThrow(
      /invalid name slug/i,
    );
  });

  it("throws on invalid user handle", () => {
    expect(() => formatId({ kind: "skill", user: "bad user", name: "foo" })).toThrow(
      /invalid user handle/i,
    );
  });
});
