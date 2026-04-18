import type { IndexEntry } from "@clawmart/schema";
import type { RegistryClient } from "../registry/client.js";

export type SearchOptions = {
  query: string;
  client: RegistryClient;
  limit?: number;
};

export async function searchCommand(opts: SearchOptions): Promise<IndexEntry[]> {
  const index = await opts.client.fetchIndex();
  const needle = opts.query.toLowerCase();
  const matches = index.entries.filter((entry) => {
    if (entry.name.toLowerCase().includes(needle)) return true;
    if (entry.displayName.toLowerCase().includes(needle)) return true;
    if (entry.description.toLowerCase().includes(needle)) return true;
    return entry.tags.some((t) => t.toLowerCase().includes(needle));
  });
  return matches.slice(0, opts.limit ?? 50);
}
