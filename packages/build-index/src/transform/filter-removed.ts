import type { Entry, RemovedIndex } from "@clawforge/schema";

export function filterRemoved(entries: Entry[], idx: RemovedIndex): Entry[] {
  const removed = new Set(Object.keys(idx.entries));
  return entries.filter((e) => !removed.has(`${e.kind}:${e.name}`));
}
