import { parseEntry } from "@clawmart/schema";
import type { ValidationIssue } from "../issue.js";

export type LoadedEntry = {
  kind: string;
  slug: string;
  absolutePath: string;
  relativePath: string;
  dir: string;
  raw: unknown;
};

export function checkSchema(entries: LoadedEntry[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const loaded of entries) {
    try {
      parseEntry(loaded.raw);
    } catch (err) {
      issues.push({
        code: "ENTRY_INVALID",
        severity: "BLOCK",
        message: err instanceof Error ? err.message : String(err),
        path: loaded.relativePath,
        id: `${loaded.kind}:${loaded.slug}`,
      });
    }
  }
  return issues;
}
