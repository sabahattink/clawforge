import { readFile } from "node:fs/promises";
import { enumerateEntries } from "@clawmart/build-index";
import { checkDuplicates } from "./checks/duplicates.js";
import { checkFileExistence } from "./checks/file-existence.js";
import { type LoadedEntry, checkSchema } from "./checks/schema.js";
import { checkSecurity } from "./checks/security.js";
import { type ValidationIssue, type ValidationReport, summarize } from "./issue.js";

export type RunOptions = {
  registryRoot: string;
};

export async function runValidator(opts: RunOptions): Promise<ValidationReport> {
  const locations = await enumerateEntries(opts.registryRoot);
  const entries: LoadedEntry[] = [];
  const issues: ValidationIssue[] = [];

  for (const loc of locations) {
    let raw: unknown = null;
    try {
      const text = await readFile(loc.absolutePath, "utf8");
      raw = JSON.parse(text);
    } catch (err) {
      issues.push({
        code: "ENTRY_UNREADABLE",
        severity: "BLOCK",
        message: err instanceof Error ? err.message : String(err),
        path: loc.absolutePath,
        id: `${loc.kind}:${loc.slug}`,
      });
      continue;
    }
    entries.push({
      kind: loc.kind,
      slug: loc.slug,
      absolutePath: loc.absolutePath,
      relativePath: loc.relativePath,
      dir: loc.dir,
      raw,
    });
  }

  issues.push(...checkSchema(entries));
  issues.push(...checkDuplicates(entries));
  issues.push(...(await checkFileExistence(entries)));
  issues.push(...(await checkSecurity(entries)));

  return summarize(issues);
}
