import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { setPath } from "../jsonpath.js";
import { readManifest, removeById, writeManifest } from "../manifest/io.js";
import type { Scope } from "../manifest/types.js";
import { resolveScope } from "../scope/resolve.js";

export type RemoveOptions = {
  id: string;
  scope?: Scope;
  cwd?: string;
  home?: string;
  dryRun: boolean;
};

export type RemoveResult = {
  filesRemoved: string[];
  jsonRestored: number;
  found: boolean;
};

export async function removeCommand(opts: RemoveOptions): Promise<RemoveResult> {
  const scope = resolveScope({
    ...(opts.scope !== undefined ? { scope: opts.scope } : {}),
    ...(opts.cwd !== undefined ? { cwd: opts.cwd } : {}),
    ...(opts.home !== undefined ? { home: opts.home } : {}),
  });
  const manifest = await readManifest(scope.manifestPath, {
    scope: scope.scope,
    claudeDir: scope.claudeDir,
  });
  const { manifest: updated, removed } = removeById(manifest, opts.id);

  if (removed === null) {
    return { filesRemoved: [], jsonRestored: 0, found: false };
  }

  const filesRemoved: string[] = [];
  if (!opts.dryRun) {
    for (const file of removed.files) {
      try {
        await rm(file);
        filesRemoved.push(file);
      } catch {
        // already missing; ignore
      }
    }
    for (const merge of removed.jsonMerges) {
      const targetPath = join(scope.claudeDir, merge.target);
      try {
        const raw = await readFile(targetPath, "utf8");
        const current = JSON.parse(raw) as Record<string, unknown>;
        const restored = setPath(current, merge.path, merge.before);
        await writeFile(targetPath, `${JSON.stringify(restored, null, 2)}\n`, "utf8");
      } catch {
        // file gone or corrupt; skip
      }
    }
    await writeManifest(scope.manifestPath, updated);
  }

  return { filesRemoved, jsonRestored: removed.jsonMerges.length, found: true };
}
