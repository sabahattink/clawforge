import { describe, expect, it } from "vitest";
import { generateFeed } from "../../src/transform/feed.js";

describe("generateFeed", () => {
  it("emits newest entries first, capped at 50", () => {
    const entries = Array.from({ length: 60 }, (_, i) => ({
      kind: "skill",
      name: `e${i}`,
      displayName: `E${i}`,
      description: "x",
      updatedAt: `2026-04-${String((i % 18) + 1).padStart(2, "0")}T12:00:00.000Z`,
    }));
    const xml = generateFeed({ siteBase: "https://clawmart.dev", entries });
    const itemCount = (xml.match(/<item>/g) ?? []).length;
    expect(itemCount).toBe(50);
  });

  it("includes channel metadata", () => {
    const xml = generateFeed({ siteBase: "https://clawmart.dev", entries: [] });
    expect(xml).toContain("<title>clawmart — new entries</title>");
    expect(xml).toContain("<link>https://clawmart.dev</link>");
  });

  it("escapes xml special chars in description", () => {
    const xml = generateFeed({
      siteBase: "https://clawmart.dev",
      entries: [
        {
          kind: "skill",
          name: "x",
          displayName: "X",
          description: "a & b <c>",
          updatedAt: "2026-04-10T12:00:00.000Z",
        },
      ],
    });
    expect(xml).toContain("a &amp; b &lt;c&gt;");
  });
});
