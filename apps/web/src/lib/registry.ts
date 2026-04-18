import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import type { IndexEntry, Kind, RegistryIndex } from "@clawmart/schema";
import { RegistryIndexSchema } from "@clawmart/schema";

const here = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(here, "../../data/registry.json");

let cached: RegistryIndex | null = null;

export function getIndex(): RegistryIndex {
  if (cached !== null) return cached;
  const raw = readFileSync(DATA_PATH, "utf8");
  cached = RegistryIndexSchema.parse(JSON.parse(raw));
  return cached;
}

export function getEntryByKindSlug(kind: Kind, slug: string): IndexEntry | null {
  const entries = getIndex().entries;
  return entries.find((e) => e.kind === kind && e.name === slug) ?? null;
}

export function getFeatured(limit = 6): IndexEntry[] {
  return getIndex()
    .entries.filter((e) => e.verified)
    .slice(0, limit);
}

export function countByKind(): Record<Kind, number> {
  const counts: Record<string, number> = {
    skill: 0,
    agent: 0,
    hook: 0,
    mcp: 0,
    cmd: 0,
    preset: 0,
  };
  for (const entry of getIndex().entries) counts[entry.kind] = (counts[entry.kind] ?? 0) + 1;
  return counts as Record<Kind, number>;
}

export function allKinds(): Kind[] {
  return ["skill", "agent", "hook", "mcp", "cmd", "preset"];
}

export function kindDirName(kind: Kind): string {
  switch (kind) {
    case "skill":
      return "skills";
    case "agent":
      return "agents";
    case "cmd":
      return "commands";
    case "hook":
      return "hooks";
    case "mcp":
      return "mcp-servers";
    case "preset":
      return "presets";
  }
}
