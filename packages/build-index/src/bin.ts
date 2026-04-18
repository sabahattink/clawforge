#!/usr/bin/env node
import { resolve } from "node:path";
import { buildIndex } from "./build.js";
import { ExecaGitReader } from "./git/timestamps.js";

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const opts: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key === undefined || value === undefined) break;
    opts[key.replace(/^--/, "")] = value;
  }

  const registryRoot = resolve(opts.registry ?? "registry");
  const distDir = resolve(opts.out ?? "dist");
  const cdnBase = opts["cdn-base"] ?? "https://cdn.clawmart.dev";
  const siteBase = opts["site-base"] ?? "https://clawmart.dev";
  const generatedAt = opts["generated-at"] ?? new Date().toISOString();

  const git = new ExecaGitReader(process.cwd());
  const result = await buildIndex({
    registryRoot,
    distDir,
    cdnBase,
    siteBase,
    generatedAt,
    git,
  });

  if (!result.ok) {
    process.stderr.write(`build-index failed: ${result.error.message}\n`);
    process.exit(1);
  }
  if (result.value.errors.length > 0) {
    for (const err of result.value.errors) {
      process.stderr.write(
        `! ${err.code}: ${err.message}${err.path !== undefined ? ` (${err.path})` : ""}\n`,
      );
    }
    process.exit(2);
  }
  process.stdout.write(`build-index: ${result.value.registryIndex.count} entries -> ${distDir}\n`);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`unexpected: ${message}\n`);
  process.exit(3);
});
