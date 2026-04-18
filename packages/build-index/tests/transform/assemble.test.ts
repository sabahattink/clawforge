import type { IndexEntry } from "@clawmart/schema";
import { describe, expect, it } from "vitest";
import { assembleIndex, shardByKind } from "../../src/transform/assemble.js";

const ix = (id: string, kind: "skill" | "agent" = "skill"): IndexEntry => ({
  id,
  kind,
  name: id.split(":")[1] ?? "x",
  displayName: id,
  description: "x",
  tags: [],
  category: "testing",
  verified: false,
  version: "1.0.0",
  author: "kalkan",
  detailUrl: `https://cdn.clawmart.dev/${id}/entry.json`,
  sha256: "a".repeat(64),
  updatedAt: "2026-04-10T18:00:00.000Z",
});

describe("assembleIndex", () => {
  it("builds a RegistryIndex with count and generatedAt", () => {
    const idx = assembleIndex([ix("skill:a"), ix("skill:b")], "2026-04-18T12:00:00.000Z");
    expect(idx.count).toBe(2);
    expect(idx.generatedAt).toBe("2026-04-18T12:00:00.000Z");
    expect(idx.entries).toHaveLength(2);
  });
});

describe("shardByKind", () => {
  it("shards entries into per-kind indexes", () => {
    const all = [ix("skill:a"), ix("agent:b", "agent")];
    const shards = shardByKind(all, "2026-04-18T12:00:00.000Z");
    expect(Object.keys(shards).sort()).toEqual(["agent", "skill"]);
    expect(shards.skill?.count).toBe(1);
    expect(shards.agent?.count).toBe(1);
  });
});
