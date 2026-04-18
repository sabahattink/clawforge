import { execa } from "execa";
import type { Result } from "../types.js";

export type GitReader = {
  firstCommitDate(path: string): Promise<string | null>;
  lastCommitDate(path: string): Promise<string | null>;
  lastCommitSha(): Promise<string>;
};

export type ResolvedTimestamps = {
  createdAt: string;
  updatedAt: string;
  sourceCommit: string;
};

export async function resolveTimestamps(
  git: GitReader,
  path: string,
): Promise<Result<ResolvedTimestamps>> {
  const [createdAt, updatedAt] = await Promise.all([
    git.firstCommitDate(path),
    git.lastCommitDate(path),
  ]);
  if (createdAt === null || updatedAt === null) {
    return {
      ok: false,
      error: { code: "GIT_NO_HISTORY", message: `no git history for ${path}`, path },
    };
  }
  const sourceCommit = await git.lastCommitSha();
  return { ok: true, value: { createdAt, updatedAt, sourceCommit } };
}

export class ExecaGitReader implements GitReader {
  constructor(private readonly cwd: string) {}

  async firstCommitDate(path: string): Promise<string | null> {
    return this.runLog(path, "--diff-filter=A", true);
  }

  async lastCommitDate(path: string): Promise<string | null> {
    return this.runLog(path, undefined, false);
  }

  async lastCommitSha(): Promise<string> {
    const { stdout } = await execa("git", ["rev-parse", "HEAD"], { cwd: this.cwd });
    return stdout.trim();
  }

  private async runLog(
    path: string,
    extra: string | undefined,
    first: boolean,
  ): Promise<string | null> {
    const args = ["log", "--format=%aI"];
    if (extra !== undefined) args.push(extra);
    args.push("--", path);
    const { stdout } = await execa("git", args, { cwd: this.cwd });
    const lines = stdout.split("\n").filter(Boolean);
    if (lines.length === 0) return null;
    const chosen = first ? lines[lines.length - 1] : lines[0];
    if (chosen === undefined) return null;
    // Git emits %aI with a timezone offset (e.g. "+02:00"); normalise to UTC Z.
    const parsed = Date.parse(chosen);
    if (Number.isNaN(parsed)) return null;
    return new Date(parsed).toISOString();
  }
}
