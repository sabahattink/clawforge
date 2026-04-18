import type { Entry } from "@clawforge/schema";
import { installFiles } from "./files.js";
import { installMerge } from "./merge.js";
import type { InstallResult, InstallerContext } from "./types.js";

export async function installEntry(ctx: InstallerContext): Promise<InstallResult> {
  return dispatch(ctx.entry, ctx);
}

function dispatch(entry: Entry, ctx: InstallerContext): Promise<InstallResult> {
  switch (entry.kind) {
    case "skill":
    case "agent":
    case "cmd":
      return installFiles(ctx);
    case "hook":
    case "mcp":
      return installMerge(ctx);
    case "preset":
      throw new Error("preset installer requires registry client; use installPreset");
  }
}
