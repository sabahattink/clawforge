export type Scope = "global" | "project";

export type JsonMergeRecord = {
  target: string;
  path: string;
  before: unknown;
  after: unknown;
};

export type InstalledRecord = {
  id: string;
  version: string;
  installedAt: string;
  source: string;
  sourceCommit: string;
  verifiedAtInstall: boolean;
  files: string[];
  jsonMerges: JsonMergeRecord[];
  sha256: string;
};

export type Manifest = {
  version: 1;
  scope: Scope;
  claudeDir: string;
  installed: InstalledRecord[];
};

export function emptyManifest(scope: Scope, claudeDir: string): Manifest {
  return { version: 1, scope, claudeDir, installed: [] };
}
