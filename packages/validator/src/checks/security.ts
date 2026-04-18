import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ValidationIssue } from "../issue.js";
import type { LoadedEntry } from "./schema.js";

type SnippetEntry = { snippetFile?: string };

const BLOCK_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: "rm-rf-root", re: /\brm\s+-rf\s+(\/|\$HOME|~)/ },
  { name: "curl-pipe-shell", re: /curl\s+[^|]*\|\s*(sh|bash|zsh|fish)\b/ },
  { name: "wget-pipe-shell", re: /wget\s+[^|]*\|\s*(sh|bash|zsh|fish)\b/ },
  { name: "eval-curl", re: /eval\s+["'`]?\$\(\s*curl/ },
  { name: "dd-zero", re: /\bdd\s+if=\/dev\/zero/ },
  { name: "redirect-sda", re: />\s*\/dev\/sd[a-z]/ },
  { name: "chmod-777", re: /\bchmod\s+777\b/ },
];

const WARN_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: "sudo", re: /\bsudo\b/ },
  { name: "ssh-keys", re: /~\/\.ssh\// },
  { name: "aws-creds", re: /~\/\.aws\// },
  { name: "dotenv-read", re: /\.env\b/ },
  { name: "shell-history", re: /\bhistory\b/ },
];

export async function checkSecurity(entries: LoadedEntry[]): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  for (const loaded of entries) {
    if (loaded.kind !== "hook" && loaded.kind !== "mcp") continue;
    const raw = loaded.raw as SnippetEntry | null;
    if (raw === null || typeof raw !== "object") continue;
    if (typeof raw.snippetFile !== "string") continue;

    let content: string;
    try {
      content = await readFile(join(loaded.dir, raw.snippetFile), "utf8");
    } catch {
      continue; // file-existence check will flag this separately
    }

    for (const { name, re } of BLOCK_PATTERNS) {
      if (re.test(content)) {
        issues.push({
          code: `SECURITY_BLOCK_${name.toUpperCase().replace(/-/g, "_")}`,
          severity: "BLOCK",
          message: `snippet ${raw.snippetFile} matches block pattern "${name}"`,
          path: join(loaded.dir, raw.snippetFile),
          id: `${loaded.kind}:${loaded.slug}`,
        });
      }
    }
    for (const { name, re } of WARN_PATTERNS) {
      if (re.test(content)) {
        issues.push({
          code: `SECURITY_WARN_${name.toUpperCase().replace(/-/g, "_")}`,
          severity: "WARN",
          message: `snippet ${raw.snippetFile} matches warn pattern "${name}"`,
          path: join(loaded.dir, raw.snippetFile),
          id: `${loaded.kind}:${loaded.slug}`,
        });
      }
    }
  }
  return issues;
}
