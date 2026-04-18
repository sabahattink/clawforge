import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { runValidator } from "../src/run.js";

const here = fileURLToPath(new URL(".", import.meta.url));
const fixtureRoot = resolve(here, "fixtures/registry");

describe("runValidator", () => {
  it("flags the dangerous hook and accepts the good skill", async () => {
    const report = await runValidator({ registryRoot: fixtureRoot });
    expect(report.blockingCount).toBeGreaterThanOrEqual(1);
    const codes = report.issues.map((i) => i.code);
    expect(codes.some((c) => c.startsWith("SECURITY_BLOCK_"))).toBe(true);
  });

  it("returns an empty report for an empty registry", async () => {
    const report = await runValidator({ registryRoot: "/nonexistent-registry-root-xyz" });
    expect(report.blockingCount).toBe(0);
    expect(report.warningCount).toBe(0);
  });
});
