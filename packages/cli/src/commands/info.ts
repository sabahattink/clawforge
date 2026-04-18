import type { IndexEntry } from "@clawforge/schema";
import type { RegistryClient } from "../registry/client.js";

export type InfoOptions = {
  id: string;
  client: RegistryClient;
};

export async function infoCommand(opts: InfoOptions): Promise<IndexEntry | null> {
  const index = await opts.client.fetchIndex();
  return index.entries.find((e) => e.id === opts.id) ?? null;
}
