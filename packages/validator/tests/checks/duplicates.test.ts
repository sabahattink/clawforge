import { describe, expect, it } from "vitest";
import { checkDuplicates } from "../../src/checks/duplicates.js";
import type { LoadedEntry } from "../../src/checks/schema.js";

const mk = (slug: string, rel: string): LoadedEntry => ({
  kind: "skill",
  slug,
  absolutePath: `/${rel}`,
  relativePath: rel,
  dir: `/skills/${slug}`,
  raw: {},
});

describe("checkDuplicates", () => {
  it("flags two entries with same id", () => {
    const issues = checkDuplicates([
      mk("tdd", "skills/tdd/entry.json"),
      mk("tdd", "skills/tdd-dup/entry.json"),
    ]);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.code).toBe("DUPLICATE_ID");
    expect(issues[0]?.severity).toBe("BLOCK");
  });

  it("accepts unique ids", () => {
    const issues = checkDuplicates([mk("a", "skills/a/entry.json"), mk("b", "skills/b/entry.json")]);
    expect(issues).toEqual([]);
  });
});
