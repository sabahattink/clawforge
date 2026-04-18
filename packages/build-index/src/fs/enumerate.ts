import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import type { Kind } from "@clawforge/schema";

export type EntryLocation = {
  kind: Kind;
  slug: string;
  absolutePath: string;
  relativePath: string;
  dir: string;
};

const KIND_DIRS: Record<string, Kind> = {
  skills: "skill",
  agents: "agent",
  commands: "cmd",
  hooks: "hook",
  "mcp-servers": "mcp",
  presets: "preset",
};

export async function enumerateEntries(registryRoot: string): Promise<EntryLocation[]> {
  const out: EntryLocation[] = [];
  let topLevel: import("node:fs").Dirent[];
  try {
    topLevel = await readdir(registryRoot, { withFileTypes: true });
  } catch {
    return out;
  }

  for (const kindDirEnt of topLevel) {
    if (!kindDirEnt.isDirectory()) continue;
    const kindDir = kindDirEnt.name;
    const kind = KIND_DIRS[kindDir];
    if (kind === undefined) continue;

    const kindRoot = join(registryRoot, kindDir);
    const slugEntries = await readdir(kindRoot, { withFileTypes: true });
    for (const slugEnt of slugEntries) {
      if (!slugEnt.isDirectory()) continue;
      const slug = slugEnt.name;
      const entryJson = join(kindRoot, slug, "entry.json");
      if (!(await exists(entryJson))) continue;
      out.push({
        kind,
        slug,
        absolutePath: entryJson,
        relativePath: `${kindDir}/${slug}/entry.json`,
        dir: join(kindRoot, slug),
      });
    }
  }
  return out;
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}
