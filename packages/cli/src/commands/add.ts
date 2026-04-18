import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { parseId, parseEntry, type Entry, type IndexEntry } from "@clawmart/schema";
import { installEntry } from "../installers/dispatch.js";
import type { PromptFn } from "../installers/types.js";
import { readManifest, upsert, writeManifest } from "../manifest/io.js";
import type { InstalledRecord } from "../manifest/types.js";
import type { RegistryClient } from "../registry/client.js";
import { resolveScope } from "../scope/resolve.js";
import type { Scope } from "../manifest/types.js";

export type AddOptions = {
  id: string;
  client: RegistryClient;
  scope?: Scope;
  cwd?: string;
  home?: string;
  track: boolean;
  force: boolean;
  dryRun: boolean;
  onPrompt: PromptFn;
  downloadDir: string;
};

export type AddResult = {
  entry: Entry;
  files: string[];
  jsonMerges: { target: string; path: string; before: unknown; after: unknown }[];
  tracked: boolean;
  skipped: boolean;
};

export async function addCommand(opts: AddOptions): Promise<AddResult> {
  const parsed = parseId(opts.id);
  const index = await opts.client.fetchIndex();
  const indexEntry = findInIndex(index.entries, opts.id);
  if (indexEntry === null) {
    throw new Error(`entry ${opts.id} not found in registry`);
  }

  const entry = await opts.client.fetchEntry(indexEntry.detailUrl);
  const validated = parseEntry(entry);

  const scope = resolveScope(
    { scope: opts.scope, cwd: opts.cwd, home: opts.home },
    parsed.kind,
  );

  const entryDir = join(opts.downloadDir, opts.id.replace(/[/:@]/g, "_"));
  await mkdir(entryDir, { recursive: true });
  await downloadContentFiles(validated, entryDir, opts.client, indexEntry.detailUrl);

  const result = await installEntry({
    entry: validated,
    entryDir,
    claudeDir: scope.claudeDir,
    dryRun: opts.dryRun,
    force: opts.force,
    onPrompt: opts.onPrompt,
  });

  if (opts.track && !opts.dryRun) {
    const manifest = await readManifest(scope.manifestPath, {
      scope: scope.scope,
      claudeDir: scope.claudeDir,
    });
    const record: InstalledRecord = {
      id: opts.id,
      version: validated.version,
      installedAt: new Date().toISOString(),
      source: indexEntry.detailUrl,
      sourceCommit: validated.sourceCommit,
      verifiedAtInstall: validated.verified,
      files: result.files,
      jsonMerges: result.jsonMerges,
      sha256: validated.sha256,
    };
    await writeManifest(scope.manifestPath, upsert(manifest, record));
  }

  return {
    entry: validated,
    files: result.files,
    jsonMerges: result.jsonMerges,
    tracked: opts.track && !opts.dryRun,
    skipped: result.skipped,
  };
}

function findInIndex(entries: IndexEntry[], id: string): IndexEntry | null {
  return entries.find((e) => e.id === id) ?? null;
}

async function downloadContentFiles(
  entry: Entry,
  entryDir: string,
  client: RegistryClient,
  detailUrl: string,
): Promise<void> {
  const base = detailUrl.replace(/\/entry\.json$/, "");
  const sources: string[] = [];
  if ("files" in entry) {
    for (const f of entry.files) sources.push(f.source);
  }
  if (entry.kind === "hook" || entry.kind === "mcp") {
    sources.push(entry.snippetFile);
  }
  if (entry.kind === "preset" && entry.settingsPatch !== undefined) {
    sources.push(entry.settingsPatch);
  }

  for (const source of sources) {
    const url = `${base}/${source}`;
    const buf = await client.fetchFile(url);
    const dest = join(entryDir, source);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, buf);
  }
}
