#!/usr/bin/env node
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Command } from "commander";
import pc from "picocolors";
import prompts from "prompts";
import { addCommand } from "./commands/add.js";
import { browseCommand } from "./commands/browse.js";
import { doctorCommand } from "./commands/doctor.js";
import { infoCommand } from "./commands/info.js";
import { initCommand } from "./commands/init.js";
import { listCommand } from "./commands/list.js";
import { removeCommand } from "./commands/remove.js";
import { searchCommand } from "./commands/search.js";
import { updateCommand } from "./commands/update.js";
import type { PromptFn } from "./installers/types.js";
import type { Scope } from "./manifest/types.js";
import { HttpRegistryClient } from "./registry/client.js";

const DEFAULT_CDN = "https://cdn.clawforge.dev";

type GlobalOpts = {
  scope?: Scope;
  registry?: string;
  track?: boolean;
  force?: boolean;
  dryRun?: boolean;
  yes?: boolean;
  json?: boolean;
  cache?: boolean;
};

function makeClient(opts: GlobalOpts): HttpRegistryClient {
  return new HttpRegistryClient({
    cdnBase: opts.registry ?? DEFAULT_CDN,
    noCache: opts.cache === false,
  });
}

function promptFn(opts: GlobalOpts): PromptFn {
  if (opts.yes === true) {
    return async () => "overwrite";
  }
  return async (question, choices) => {
    const response = await prompts({
      type: "select",
      name: "choice",
      message: question,
      choices: choices.map((c) => ({ title: c, value: c })),
    });
    return (response.choice as string | undefined) ?? choices[0] ?? "skip";
  };
}

async function main(): Promise<void> {
  const program = new Command();
  program
    .name("clawforge")
    .description("The registry for Claude Code.")
    .version("0.0.1")
    .option("--scope <scope>", "install scope: global or project")
    .option("--registry <url>", "registry CDN base URL", DEFAULT_CDN)
    .option("--track", "record installs in the manifest", false)
    .option("--force", "overwrite prompts automatically", false)
    .option("--dry-run", "print plan, do not write", false)
    .option("--yes, -y", "non-interactive (accept defaults)", false)
    .option("--json", "machine-readable output", false)
    .option("--no-cache", "bypass registry cache");

  program
    .command("init")
    .description("initialise a clawforge manifest")
    .action(async () => {
      const o = program.opts<GlobalOpts>();
      const scope: Scope = o.scope ?? "global";
      const result = await initCommand({ scope });
      process.stdout.write(pc.green(`init ok: ${result.manifestPath}\n`));
    });

  program
    .command("add <id>")
    .description("install an entry by id (e.g. skill:tdd-workflow)")
    .action(async (id: string) => {
      const o = program.opts<GlobalOpts>();
      const downloadDir = await mkdtemp(join(tmpdir(), "clawforge-dl-"));
      const result = await addCommand({
        id,
        client: makeClient(o),
        ...(o.scope !== undefined ? { scope: o.scope } : {}),
        track: o.track === true,
        force: o.force === true,
        dryRun: o.dryRun === true,
        onPrompt: promptFn(o),
        downloadDir,
      });
      if (o.json === true) {
        process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      } else {
        process.stdout.write(
          `${pc.green(`installed ${id}`)} — ${result.files.length} file(s), ${result.jsonMerges.length} merge(s)${result.tracked ? " [tracked]" : ""}\n`,
        );
      }
    });

  program
    .command("list")
    .description("list installed entries from the manifest")
    .action(async () => {
      const o = program.opts<GlobalOpts>();
      const records = await listCommand(o.scope !== undefined ? { scope: o.scope } : {});
      if (o.json === true) {
        process.stdout.write(`${JSON.stringify(records, null, 2)}\n`);
      } else if (records.length === 0) {
        process.stdout.write(pc.dim("no entries installed\n"));
      } else {
        for (const r of records) {
          process.stdout.write(
            `${pc.cyan(r.id)}  ${pc.dim(r.version)}  ${r.verifiedAtInstall ? pc.green("✓") : " "}\n`,
          );
        }
      }
    });

  program
    .command("info <id>")
    .description("show metadata for an entry")
    .action(async (id: string) => {
      const o = program.opts<GlobalOpts>();
      const entry = await infoCommand({ id, client: makeClient(o) });
      if (entry === null) {
        process.stderr.write(pc.red(`not found: ${id}\n`));
        process.exit(1);
      }
      process.stdout.write(`${JSON.stringify(entry, null, 2)}\n`);
    });

  program
    .command("search <query>")
    .description("search the registry")
    .action(async (query: string) => {
      const o = program.opts<GlobalOpts>();
      const results = await searchCommand({ query, client: makeClient(o) });
      if (results.length === 0) {
        process.stdout.write(pc.dim("no matches\n"));
        return;
      }
      for (const r of results) {
        process.stdout.write(
          `${pc.cyan(r.id)}  ${pc.dim(r.version)}  ${r.verified ? pc.green("✓") : " "}  ${r.description}\n`,
        );
      }
    });

  program
    .command("remove <id>")
    .description("uninstall an entry, reverting files and JSON merges")
    .action(async (id: string) => {
      const o = program.opts<GlobalOpts>();
      const result = await removeCommand({
        id,
        ...(o.scope !== undefined ? { scope: o.scope } : {}),
        dryRun: o.dryRun === true,
      });
      if (!result.found) {
        process.stderr.write(pc.red(`not tracked: ${id}\n`));
        process.exit(1);
      }
      process.stdout.write(
        `${pc.green(`removed ${id}`)} — ${result.filesRemoved.length} file(s), ${result.jsonRestored} merge(s) reverted\n`,
      );
    });

  program
    .command("update [id]")
    .description("check for and apply updates to tracked entries")
    .action(async (id: string | undefined) => {
      const o = program.opts<GlobalOpts>();
      const plans = await updateCommand({
        ...(id !== undefined ? { id } : {}),
        client: makeClient(o),
        ...(o.scope !== undefined ? { scope: o.scope } : {}),
      });
      for (const plan of plans) {
        const arrow = plan.needsUpdate ? pc.yellow("→") : pc.dim("=");
        process.stdout.write(
          `${pc.cyan(plan.id)}  ${plan.currentVersion} ${arrow} ${plan.latestVersion}\n`,
        );
      }
    });

  program
    .command("doctor")
    .description("verify installed entries against the manifest")
    .action(async () => {
      const o = program.opts<GlobalOpts>();
      const report = await doctorCommand(o.scope !== undefined ? { scope: o.scope } : {});
      process.stdout.write(
        `tracked: ${report.total}, missing files: ${report.missingFiles.length}\n`,
      );
      for (const { record, file } of report.missingFiles) {
        process.stderr.write(pc.red(`missing: ${record.id} -> ${file}\n`));
      }
      if (report.missingFiles.length > 0) process.exit(1);
    });

  program
    .command("browse")
    .description("open the clawforge web site")
    .action(() => {
      const url = browseCommand();
      process.stdout.write(`${url}\n`);
    });

  await program.parseAsync(process.argv);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(pc.red(`error: ${message}\n`));
  process.exit(1);
});
