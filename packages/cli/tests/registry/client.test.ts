import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HttpRegistryClient } from "../../src/registry/client.js";

let cacheDir: string;
beforeEach(() => {
  cacheDir = mkdtempSync(join(tmpdir(), "clawmart-clientcache-"));
});
afterEach(() => rmSync(cacheDir, { recursive: true, force: true }));

const okResponse = (body: unknown): Response =>
  new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });

describe("HttpRegistryClient", () => {
  it("fetches and parses the index", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        okResponse({ version: 1, generatedAt: "2026-04-19T00:00:00.000Z", count: 0, entries: [] }),
      );
    const client = new HttpRegistryClient({
      cdnBase: "https://cdn.example",
      cacheDir,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const idx = await client.fetchIndex();
    expect(idx.count).toBe(0);
    expect(fetchImpl).toHaveBeenCalledWith("https://cdn.example/registry.json");
  });

  it("serves from cache on second call", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        okResponse({ version: 1, generatedAt: "2026-04-19T00:00:00.000Z", count: 0, entries: [] }),
      );
    const client = new HttpRegistryClient({
      cdnBase: "https://cdn.example",
      cacheDir,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    await client.fetchIndex();
    await client.fetchIndex();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("bypasses cache when noCache is set", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockImplementation(async () =>
        okResponse({ version: 1, generatedAt: "2026-04-19T00:00:00.000Z", count: 0, entries: [] }),
      );
    const client = new HttpRegistryClient({
      cdnBase: "https://cdn.example",
      cacheDir,
      noCache: true,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    await client.fetchIndex();
    await client.fetchIndex();
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("fetchEntry parses entry JSON", async () => {
    const entryShape = { kind: "skill", name: "tdd-workflow" };
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => okResponse(entryShape));
    const client = new HttpRegistryClient({
      cdnBase: "https://cdn.example",
      cacheDir,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const entry = await client.fetchEntry("https://cdn.example/skill/entry.json");
    expect(entry.name).toBe("tdd-workflow");
  });

  it("fetchFile returns raw buffer", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockImplementation(
        async () => new Response(Buffer.from("raw bytes"), { status: 200 }),
      );
    const client = new HttpRegistryClient({
      cdnBase: "https://cdn.example",
      cacheDir,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const buf = await client.fetchFile("https://cdn.example/skill.md");
    expect(buf.toString()).toBe("raw bytes");
  });

  it("throws on non-2xx response", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("not found", { status: 404, statusText: "Not Found" }));
    const client = new HttpRegistryClient({
      cdnBase: "https://cdn.example",
      cacheDir,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    await expect(client.fetchIndex()).rejects.toThrow(/fetch failed/);
  });
});
