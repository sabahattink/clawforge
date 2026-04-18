import type { Entry, IndexEntry } from "@clawforge/schema";

export function toIndexEntry(entry: Entry, cdnBase: string): IndexEntry {
  const kindDir = toKindDir(entry.kind);
  return {
    id: `${entry.kind}:${entry.name}`,
    kind: entry.kind,
    name: entry.name,
    displayName: entry.displayName,
    description: entry.description,
    tags: entry.tags,
    category: entry.category,
    verified: entry.verified,
    version: entry.version,
    author: entry.author.github,
    detailUrl: `${cdnBase.replace(/\/$/, "")}/${kindDir}/${entry.name}/entry.json`,
    sha256: entry.sha256,
    updatedAt: entry.updatedAt,
  };
}

function toKindDir(kind: Entry["kind"]): string {
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
