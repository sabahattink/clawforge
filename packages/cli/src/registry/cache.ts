import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export type CacheOptions = {
  cacheDir?: string;
  ttlMs?: number;
};

function keyFor(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 32);
}

function defaultCacheDir(): string {
  return join(homedir(), ".clawmart", "cache");
}

export async function readCached(url: string, opts: CacheOptions = {}): Promise<Buffer | null> {
  const dir = opts.cacheDir ?? defaultCacheDir();
  const path = join(dir, keyFor(url));
  try {
    const info = await stat(path);
    const age = Date.now() - info.mtimeMs;
    if (age > (opts.ttlMs ?? CACHE_TTL_MS)) return null;
    return await readFile(path);
  } catch {
    return null;
  }
}

export async function writeCache(
  url: string,
  value: Buffer,
  opts: CacheOptions = {},
): Promise<void> {
  const dir = opts.cacheDir ?? defaultCacheDir();
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, keyFor(url)), value);
}
