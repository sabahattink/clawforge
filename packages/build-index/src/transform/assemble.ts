import type { IndexEntry, RegistryIndex } from "@clawmart/schema";

export function assembleIndex(entries: IndexEntry[], generatedAt: string): RegistryIndex {
  return { version: 1, generatedAt, count: entries.length, entries };
}

export function shardByKind(
  entries: IndexEntry[],
  generatedAt: string,
): Record<string, RegistryIndex> {
  const buckets: Record<string, IndexEntry[]> = {};
  for (const entry of entries) {
    (buckets[entry.kind] ??= []).push(entry);
  }
  const result: Record<string, RegistryIndex> = {};
  for (const [kind, list] of Object.entries(buckets)) {
    result[kind] = assembleIndex(list, generatedAt);
  }
  return result;
}
