import { describe, expect, it } from "vitest";
import { generateSitemap } from "../../src/transform/sitemap.js";

describe("generateSitemap", () => {
  it("emits urls for every entry", () => {
    const xml = generateSitemap({
      siteBase: "https://clawforge.dev",
      entries: [{ kind: "skill", name: "tdd", updatedAt: "2026-04-10T18:00:00.000Z" }],
    });
    expect(xml).toContain("https://clawforge.dev/skill/tdd");
    expect(xml).toContain("<lastmod>2026-04-10</lastmod>");
    expect(xml.startsWith(`<?xml version="1.0"`)).toBe(true);
  });

  it("escapes special characters in URLs", () => {
    const xml = generateSitemap({
      siteBase: "https://clawforge.dev/",
      entries: [{ kind: "skill", name: "a&b", updatedAt: "2026-04-10T18:00:00.000Z" }],
    });
    expect(xml).toContain("a&amp;b");
  });

  it("strips trailing slash from siteBase", () => {
    const xml = generateSitemap({
      siteBase: "https://clawforge.dev/",
      entries: [{ kind: "skill", name: "x", updatedAt: "2026-04-10T18:00:00.000Z" }],
    });
    expect(xml).toContain("https://clawforge.dev/skill/x");
    expect(xml).not.toContain("https://clawforge.dev//skill");
  });
});
