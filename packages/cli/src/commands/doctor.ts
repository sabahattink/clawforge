import { access } from "node:fs/promises";
import { readManifest } from "../manifest/io.js";
import type { InstalledRecord, Scope } from "../manifest/types.js";
import { resolveScope } from "../scope/resolve.js";

export type DoctorReport = {
  total: number;
  missingFiles: { record: InstalledRecord; file: string }[];
};

export type DoctorOptions = {
  scope?: Scope;
  cwd?: string;
  home?: string;
};

export async function doctorCommand(opts: DoctorOptions): Promise<DoctorReport> {
  const scope = resolveScope(opts);
  const manifest = await readManifest(scope.manifestPath, {
    scope: scope.scope,
    claudeDir: scope.claudeDir,
  });

  const missingFiles: { record: InstalledRecord; file: string }[] = [];
  for (const record of manifest.installed) {
    for (const file of record.files) {
      try {
        await access(file);
      } catch {
        missingFiles.push({ record, file });
      }
    }
  }

  return { total: manifest.installed.length, missingFiles };
}
