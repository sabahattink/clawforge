#!/usr/bin/env node
import { resolve } from "node:path";
import { runValidator } from "./run.js";

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const opts: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key === undefined || value === undefined) break;
    opts[key.replace(/^--/, "")] = value;
  }

  const registryRoot = resolve(opts.registry ?? "registry");
  const report = await runValidator({ registryRoot });

  for (const issue of report.issues) {
    const location = issue.path !== undefined ? ` (${issue.path})` : "";
    process.stderr.write(`[${issue.severity}] ${issue.code}: ${issue.message}${location}\n`);
  }
  process.stdout.write(
    `validator: ${report.issues.length} issues (${report.blockingCount} BLOCK, ${report.warningCount} WARN)\n`,
  );

  if (report.blockingCount > 0) {
    process.exit(1);
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`unexpected: ${message}\n`);
  process.exit(2);
});
