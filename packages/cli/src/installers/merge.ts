import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Entry } from "@clawmart/schema";
import { getPath, setPath } from "../jsonpath.js";
import { type InstallResult, type InstallerContext, emptyResult } from "./types.js";

type MergeEntry = Entry & {
  snippetFile: string;
  mergeTarget: "settings.json";
  mergePath: string;
  strategy?: "append" | "replace";
};

function isMergeKind(entry: Entry): entry is MergeEntry {
  return entry.kind === "hook" || entry.kind === "mcp";
}

function expandPath(template: string, ctx: InstallerContext): string {
  return template.replace(/\{\{name\}\}/g, ctx.entry.name);
}

async function readSettingsJson(path: string): Promise<Record<string, unknown>> {
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function installMerge(ctx: InstallerContext): Promise<InstallResult> {
  if (!isMergeKind(ctx.entry)) {
    return { ...emptyResult(), skipped: true, reason: "entry is not hook/mcp" };
  }
  const entry = ctx.entry;
  const result = emptyResult();

  const snippetPath = join(ctx.entryDir, entry.snippetFile);
  const snippetRaw = await readFile(snippetPath, "utf8");
  const snippet = JSON.parse(snippetRaw) as unknown;

  const targetPath = join(ctx.claudeDir, entry.mergeTarget);
  const settings = await readSettingsJson(targetPath);
  const mergePath = expandPath(entry.mergePath, ctx);
  const before = getPath(settings, mergePath);

  const strategy = entry.kind === "hook" ? (entry.strategy ?? "append") : "replace";
  let after: unknown = snippet;

  if (strategy === "append") {
    const current = Array.isArray(before) ? before : [];
    after = [...current, snippet];
  } else if (before !== undefined && !ctx.force) {
    const choice = await ctx.onPrompt(`settings.json already has ${mergePath}. Action?`, [
      "replace",
      "skip",
    ]);
    if (choice === "skip") {
      return { ...emptyResult(), skipped: true, reason: "user skipped replace" };
    }
  }

  const nextSettings = setPath(settings, mergePath, after);
  result.jsonMerges.push({
    target: entry.mergeTarget,
    path: mergePath,
    before: before ?? null,
    after,
  });

  if (!ctx.dryRun) {
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, `${JSON.stringify(nextSettings, null, 2)}\n`, "utf8");
  }

  return result;
}
