import { readManifest } from "../manifest/io.js";
import type { InstalledRecord, Scope } from "../manifest/types.js";
import { resolveScope } from "../scope/resolve.js";

export type ListOptions = {
  scope?: Scope;
  cwd?: string;
  home?: string;
};

export async function listCommand(opts: ListOptions): Promise<InstalledRecord[]> {
  const scope = resolveScope(opts);
  const manifest = await readManifest(scope.manifestPath, {
    scope: scope.scope,
    claudeDir: scope.claudeDir,
  });
  return manifest.installed;
}
