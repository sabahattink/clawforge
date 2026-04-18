import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Entry } from "@clawmart/schema";
import { emptyResult, type InstallerContext, type InstallResult } from "./types.js";

type FileBasedEntry = Entry & { files: { source: string; target: string }[] };

function expandTarget(template: string, ctx: InstallerContext): string {
  return template
    .replace(/\{\{CLAUDE_DIR\}\}/g, ctx.claudeDir)
    .replace(/\{\{name\}\}/g, ctx.entry.name);
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await readFile(p);
    return true;
  } catch {
    return false;
  }
}

export async function installFiles(ctx: InstallerContext): Promise<InstallResult> {
  if (!("files" in ctx.entry)) {
    return { ...emptyResult(), skipped: true, reason: "entry has no files" };
  }
  const entry = ctx.entry as FileBasedEntry;
  const result = emptyResult();

  for (const mapping of entry.files) {
    const source = join(ctx.entryDir, mapping.source);
    const target = expandTarget(mapping.target, ctx);
    const exists = await pathExists(target);

    if (exists) {
      const existing = await readFile(target);
      const incoming = await readFile(source);
      if (existing.equals(incoming)) {
        continue;
      }
      if (!ctx.force) {
        const choice = await ctx.onPrompt(
          `File ${target} exists with different content. Action?`,
          ["overwrite", "skip"],
        );
        if (choice === "skip") continue;
      }
    }

    if (ctx.dryRun) {
      result.files.push(target);
      continue;
    }
    const contents = await readFile(source);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, contents);
    result.files.push(target);
  }

  return result;
}
