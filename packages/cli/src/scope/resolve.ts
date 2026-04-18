import { join } from "node:path";
import type { Kind } from "@clawmart/schema";
import type { Scope } from "../manifest/types.js";

export type ResolvedScope = {
  scope: Scope;
  claudeDir: string;
  manifestPath: string;
};

export type ResolveOptions = {
  scope?: Scope | undefined;
  cwd?: string | undefined;
  home?: string | undefined;
};

const KIND_DEFAULT_SCOPE: Record<Kind, Scope> = {
  skill: "global",
  agent: "global",
  cmd: "project",
  preset: "project",
  hook: "global",
  mcp: "global",
};

export function resolveScope(opts: ResolveOptions, kind?: Kind): ResolvedScope {
  const chosen: Scope = opts.scope ?? (kind !== undefined ? KIND_DEFAULT_SCOPE[kind] : "global");
  const base =
    chosen === "global" ? (opts.home ?? process.env.HOME ?? "~") : (opts.cwd ?? process.cwd());
  const claudeDir = join(base, ".claude");
  const manifestPath = join(claudeDir, ".clawmart", "manifest.json");
  return { scope: chosen, claudeDir, manifestPath };
}
