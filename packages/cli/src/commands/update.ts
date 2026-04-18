import { readManifest } from "../manifest/io.js";
import type { InstalledRecord, Scope } from "../manifest/types.js";
import type { RegistryClient } from "../registry/client.js";
import { resolveScope } from "../scope/resolve.js";

export type UpdatePlan = {
  id: string;
  currentVersion: string;
  latestVersion: string;
  needsUpdate: boolean;
};

export type UpdateOptions = {
  id?: string;
  client: RegistryClient;
  scope?: Scope;
  cwd?: string;
  home?: string;
};

export async function updateCommand(opts: UpdateOptions): Promise<UpdatePlan[]> {
  const scope = resolveScope(opts);
  const manifest = await readManifest(scope.manifestPath, {
    scope: scope.scope,
    claudeDir: scope.claudeDir,
  });
  const targets =
    opts.id !== undefined
      ? manifest.installed.filter((r) => r.id === opts.id)
      : manifest.installed;

  const index = await opts.client.fetchIndex();
  return targets.map((record: InstalledRecord) => {
    const latest = index.entries.find((e) => e.id === record.id);
    const latestVersion = latest?.version ?? record.version;
    return {
      id: record.id,
      currentVersion: record.version,
      latestVersion,
      needsUpdate: latestVersion !== record.version,
    };
  });
}
