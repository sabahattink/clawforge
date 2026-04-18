import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { emptyManifest, type InstalledRecord, type Manifest, type Scope } from "./types.js";

export async function readManifest(
  path: string,
  defaults: { scope: Scope; claudeDir: string },
): Promise<Manifest> {
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw) as Manifest;
  } catch {
    return emptyManifest(defaults.scope, defaults.claudeDir);
  }
}

export async function writeManifest(path: string, manifest: Manifest): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  await writeFile(tmp, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await rename(tmp, path);
}

export function upsert(manifest: Manifest, record: InstalledRecord): Manifest {
  const filtered = manifest.installed.filter((r) => r.id !== record.id);
  return { ...manifest, installed: [...filtered, record] };
}

export function removeById(
  manifest: Manifest,
  id: string,
): { manifest: Manifest; removed: InstalledRecord | null } {
  const existing = manifest.installed.find((r) => r.id === id) ?? null;
  const installed = manifest.installed.filter((r) => r.id !== id);
  return { manifest: { ...manifest, installed }, removed: existing };
}
