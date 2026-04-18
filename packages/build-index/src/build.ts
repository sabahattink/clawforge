import { join } from "node:path";
import {
  type Entry,
  type RegistryIndex,
  type RemovedIndex,
  type VerifiedIndex,
  parseEntry,
} from "@clawforge/schema";
import { enumerateEntries } from "./fs/enumerate.js";
import { readJson } from "./fs/read-json.js";
import { writeOutputs } from "./fs/write-outputs.js";
import { type GitReader, resolveTimestamps } from "./git/timestamps.js";
import { computeContentSha256 } from "./hash/sha256.js";
import { applyVerifiedIndex } from "./transform/apply-verified.js";
import { assembleIndex, shardByKind } from "./transform/assemble.js";
import { generateFeed } from "./transform/feed.js";
import { filterRemoved } from "./transform/filter-removed.js";
import { toIndexEntry } from "./transform/index-entry.js";
import { generateSitemap } from "./transform/sitemap.js";
import type { BuildError, Result } from "./types.js";

export type BuildContext = {
  registryRoot: string;
  distDir: string;
  cdnBase: string;
  siteBase: string;
  generatedAt: string;
  git: GitReader;
};

export type BuildResult = {
  registryIndex: RegistryIndex;
  shards: Record<string, RegistryIndex>;
  errors: BuildError[];
};

export async function buildIndex(ctx: BuildContext): Promise<Result<BuildResult>> {
  const verifiedRead = await readJson<VerifiedIndex>(join(ctx.registryRoot, "_verified.json"));
  const verified: VerifiedIndex = verifiedRead.ok
    ? verifiedRead.value
    : { version: 1, entries: {} };

  const removedRead = await readJson<RemovedIndex>(join(ctx.registryRoot, "_removed.json"));
  const removed: RemovedIndex = removedRead.ok ? removedRead.value : { version: 1, entries: {} };

  const locations = await enumerateEntries(ctx.registryRoot);
  const parsedEntries: Entry[] = [];
  const errors: BuildError[] = [];

  for (const loc of locations) {
    const jsonRead = await readJson(loc.absolutePath);
    if (!jsonRead.ok) {
      errors.push(jsonRead.error);
      continue;
    }

    let entry: Entry;
    try {
      entry = parseEntry(jsonRead.value);
    } catch (cause) {
      errors.push({
        code: "ENTRY_INVALID",
        message: (cause as Error).message,
        path: loc.absolutePath,
        cause,
      });
      continue;
    }

    // Use absolute path: git log accepts abs paths within the repo and
    // we cannot assume registryRoot matches git cwd.
    const ts = await resolveTimestamps(ctx.git, loc.absolutePath);
    if (!ts.ok) {
      errors.push(ts.error);
      continue;
    }

    const hashInputs = collectHashInputs(entry);
    const sha256 =
      hashInputs.length > 0 ? await computeContentSha256(loc.dir, hashInputs) : "0".repeat(64);

    parsedEntries.push({
      ...entry,
      createdAt: ts.value.createdAt,
      updatedAt: ts.value.updatedAt,
      sourceCommit: ts.value.sourceCommit,
      sha256,
    } as Entry);
  }

  const afterVerified = applyVerifiedIndex(parsedEntries, verified);
  const afterRemoved = filterRemoved(afterVerified, removed);
  const indexEntries = afterRemoved.map((e) => toIndexEntry(e, ctx.cdnBase));
  const registryIndex = assembleIndex(indexEntries, ctx.generatedAt);
  const shards = shardByKind(indexEntries, ctx.generatedAt);

  const sitemap = generateSitemap({
    siteBase: ctx.siteBase,
    entries: indexEntries.map((e) => ({
      kind: e.kind,
      name: e.name,
      updatedAt: e.updatedAt,
    })),
  });
  const feed = generateFeed({
    siteBase: ctx.siteBase,
    entries: indexEntries.map((e) => ({
      kind: e.kind,
      name: e.name,
      displayName: e.displayName,
      description: e.description,
      updatedAt: e.updatedAt,
    })),
  });

  await writeOutputs({
    distDir: ctx.distDir,
    registryIndex,
    shards,
    sitemap,
    feed,
    tombstones: removed,
  });

  return { ok: true, value: { registryIndex, shards, errors } };
}

function collectHashInputs(entry: Entry): string[] {
  if ("files" in entry) {
    return entry.files.map((f) => f.source);
  }
  if (entry.kind === "hook" || entry.kind === "mcp") {
    return [entry.snippetFile];
  }
  if (entry.kind === "preset" && entry.settingsPatch !== undefined) {
    return [entry.settingsPatch];
  }
  return [];
}
