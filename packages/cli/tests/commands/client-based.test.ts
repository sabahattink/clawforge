import type { Entry, IndexEntry, RegistryIndex } from "@clawmart/schema";
import { describe, expect, it } from "vitest";
import { infoCommand } from "../../src/commands/info.js";
import { searchCommand } from "../../src/commands/search.js";
import { updateCommand } from "../../src/commands/update.js";
import type { RegistryClient } from "../../src/registry/client.js";

const ix = (id: string, extra: Partial<IndexEntry> = {}): IndexEntry => ({
  id,
  kind: id.split(":")[0] as IndexEntry["kind"],
  name: id.split(":")[1] ?? "x",
  displayName: id,
  description: "A test entry.",
  tags: ["tdd"],
  category: "testing",
  verified: false,
  version: "1.0.0",
  author: "kalkan",
  detailUrl: `https://cdn.example/${id}/entry.json`,
  sha256: "a".repeat(64),
  updatedAt: "2026-04-19T00:00:00.000Z",
  ...extra,
});

function fakeClient(entries: IndexEntry[]): RegistryClient {
  const index: RegistryIndex = {
    version: 1,
    generatedAt: "2026-04-19T00:00:00.000Z",
    count: entries.length,
    entries,
  };
  return {
    async fetchIndex() {
      return index;
    },
    async fetchEntry(): Promise<Entry> {
      throw new Error("not used");
    },
    async fetchFile(): Promise<Buffer> {
      throw new Error("not used");
    },
  };
}

describe("infoCommand", () => {
  it("returns the index entry when found", async () => {
    const client = fakeClient([ix("skill:tdd")]);
    const e = await infoCommand({ id: "skill:tdd", client });
    expect(e?.id).toBe("skill:tdd");
  });

  it("returns null when missing", async () => {
    const client = fakeClient([]);
    expect(await infoCommand({ id: "skill:x", client })).toBeNull();
  });
});

describe("searchCommand", () => {
  it("matches by name", async () => {
    const client = fakeClient([
      ix("skill:tdd", { tags: ["a"] }),
      ix("skill:other", { tags: ["b"] }),
    ]);
    const results = await searchCommand({ query: "tdd", client });
    expect(results.map((r) => r.id)).toEqual(["skill:tdd"]);
  });

  it("matches by tag", async () => {
    const client = fakeClient([
      ix("skill:x", { tags: ["alpha"] }),
      ix("skill:y", { tags: ["beta"] }),
    ]);
    const results = await searchCommand({ query: "beta", client });
    expect(results.map((r) => r.id)).toEqual(["skill:y"]);
  });

  it("honors limit", async () => {
    const many = Array.from({ length: 10 }, (_, i) => ix(`skill:e${i}`));
    const client = fakeClient(many);
    const results = await searchCommand({ query: "e", client, limit: 3 });
    expect(results).toHaveLength(3);
  });
});

describe("updateCommand", () => {
  it("returns empty plans when manifest is empty", async () => {
    const client = fakeClient([ix("skill:tdd")]);
    const plans = await updateCommand({ client, home: "/nonexistent" });
    expect(plans).toEqual([]);
  });
});
