import type { ValidationIssue } from "../issue.js";
import type { LoadedEntry } from "./schema.js";

export function checkDuplicates(entries: LoadedEntry[]): ValidationIssue[] {
  const seen = new Map<string, LoadedEntry>();
  const issues: ValidationIssue[] = [];
  for (const loaded of entries) {
    const id = `${loaded.kind}:${loaded.slug}`;
    const prior = seen.get(id);
    if (prior !== undefined) {
      issues.push({
        code: "DUPLICATE_ID",
        severity: "BLOCK",
        message: `duplicate entry id ${id} (first at ${prior.relativePath}, also at ${loaded.relativePath})`,
        path: loaded.relativePath,
        id,
      });
    } else {
      seen.set(id, loaded);
    }
  }
  return issues;
}
