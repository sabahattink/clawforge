import { writeManifest } from "../manifest/io.js";
import { type Scope, emptyManifest } from "../manifest/types.js";
import { resolveScope } from "../scope/resolve.js";

export type InitOptions = {
  scope: Scope;
  cwd?: string;
  home?: string;
};

export type InitResult = {
  manifestPath: string;
  claudeDir: string;
  scope: Scope;
  created: boolean;
};

export async function initCommand(opts: InitOptions): Promise<InitResult> {
  const resolved = resolveScope({ scope: opts.scope, cwd: opts.cwd, home: opts.home });
  const manifest = emptyManifest(resolved.scope, resolved.claudeDir);
  await writeManifest(resolved.manifestPath, manifest);
  return {
    manifestPath: resolved.manifestPath,
    claudeDir: resolved.claudeDir,
    scope: resolved.scope,
    created: true,
  };
}
