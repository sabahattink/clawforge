import { describe, expect, it } from "vitest";
import { KINDS, KindSchema } from "../src/constants.js";

describe("KINDS", () => {
  it("contains exactly the six supported kinds", () => {
    expect(KINDS).toEqual(["skill", "agent", "hook", "mcp", "cmd", "preset"]);
  });

  it("is immutable at the type level (readonly tuple)", () => {
    const k: typeof KINDS = ["skill", "agent", "hook", "mcp", "cmd", "preset"];
    expect(k).toHaveLength(6);
  });
});

describe("KindSchema", () => {
  it("accepts every supported kind", () => {
    for (const kind of KINDS) {
      expect(KindSchema.parse(kind)).toBe(kind);
    }
  });

  it("rejects unknown kinds with a helpful error", () => {
    const result = KindSchema.safeParse("plugin");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.code).toBe("invalid_enum_value");
    }
  });
});
