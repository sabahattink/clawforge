import type { Entry, VerifiedIndex } from "@clawmart/schema";

export function applyVerifiedIndex(entries: Entry[], idx: VerifiedIndex): Entry[] {
  return entries.map((entry) => {
    const id = `${entry.kind}:${entry.name}`;
    const record = idx.entries[id];
    const verified = record !== undefined && record.verifiedVersion === entry.version;
    return { ...entry, verified } as Entry;
  });
}
