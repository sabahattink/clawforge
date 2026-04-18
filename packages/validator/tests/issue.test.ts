import { describe, expect, it } from "vitest";
import { summarize, type ValidationIssue } from "../src/issue.js";

const block: ValidationIssue = { code: "X", severity: "BLOCK", message: "x" };
const warn: ValidationIssue = { code: "Y", severity: "WARN", message: "y" };
const info: ValidationIssue = { code: "Z", severity: "INFO", message: "z" };

describe("summarize", () => {
  it("counts severities", () => {
    const r = summarize([block, block, warn, info]);
    expect(r.blockingCount).toBe(2);
    expect(r.warningCount).toBe(1);
    expect(r.issues).toHaveLength(4);
  });

  it("accepts an empty list", () => {
    const r = summarize([]);
    expect(r.blockingCount).toBe(0);
    expect(r.warningCount).toBe(0);
  });
});
