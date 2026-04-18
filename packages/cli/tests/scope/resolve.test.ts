import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveScope } from "../../src/scope/resolve.js";

describe("resolveScope", () => {
  it("uses explicit scope when provided", () => {
    const r = resolveScope({ scope: "project", cwd: "/proj", home: "/home/u" });
    expect(r.scope).toBe("project");
    expect(r.claudeDir).toBe(join("/proj", ".claude"));
  });

  it("falls back to kind default: skill → global", () => {
    const r = resolveScope({ cwd: "/proj", home: "/home/u" }, "skill");
    expect(r.scope).toBe("global");
    expect(r.claudeDir).toBe(join("/home/u", ".claude"));
  });

  it("falls back to kind default: cmd → project", () => {
    const r = resolveScope({ cwd: "/proj", home: "/home/u" }, "cmd");
    expect(r.scope).toBe("project");
    expect(r.claudeDir).toBe(join("/proj", ".claude"));
  });

  it("falls back to global when no scope and no kind", () => {
    const r = resolveScope({ cwd: "/proj", home: "/home/u" });
    expect(r.scope).toBe("global");
  });

  it("builds manifest path under .clawforge/", () => {
    const r = resolveScope({ scope: "global", home: "/home/u" });
    expect(r.manifestPath).toBe(join("/home/u", ".claude", ".clawforge", "manifest.json"));
  });
});
