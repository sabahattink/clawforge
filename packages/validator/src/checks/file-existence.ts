import { access } from "node:fs/promises";
import { join } from "node:path";
import type { ValidationIssue } from "../issue.js";
import type { LoadedEntry } from "./schema.js";

type RawEntry = {
  files?: { source?: string }[];
  snippetFile?: string;
  settingsPatch?: string;
};

export async function checkFileExistence(entries: LoadedEntry[]): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  for (const loaded of entries) {
    const raw = loaded.raw as RawEntry | null;
    if (raw === null || typeof raw !== "object") continue;

    const required: string[] = [];
    if (Array.isArray(raw.files)) {
      for (const f of raw.files) {
        if (f !== null && typeof f === "object" && typeof f.source === "string") {
          required.push(f.source);
        }
      }
    }
    if (typeof raw.snippetFile === "string") required.push(raw.snippetFile);
    if (typeof raw.settingsPatch === "string") required.push(raw.settingsPatch);

    for (const rel of required) {
      const abs = join(loaded.dir, rel);
      try {
        await access(abs);
      } catch {
        issues.push({
          code: "FILE_MISSING",
          severity: "BLOCK",
          message: `${loaded.relativePath} references ${rel} but it does not exist`,
          path: abs,
          id: `${loaded.kind}:${loaded.slug}`,
        });
      }
    }
  }
  return issues;
}
