import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execa } from "execa";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ExecaGitReader } from "../../src/git/timestamps.js";

let repo: string;
let reader: ExecaGitReader;

beforeAll(async () => {
  repo = mkdtempSync(join(tmpdir(), "clawforge-git-"));
  await execa("git", ["init", "-q"], { cwd: repo });
  await execa("git", ["config", "user.email", "test@example.com"], { cwd: repo });
  await execa("git", ["config", "user.name", "Test"], { cwd: repo });
  await execa("git", ["config", "commit.gpgsign", "false"], { cwd: repo });

  writeFileSync(join(repo, "file.txt"), "first", "utf8");
  await execa("git", ["add", "file.txt"], { cwd: repo });
  await execa("git", ["commit", "-q", "-m", "first"], { cwd: repo });

  writeFileSync(join(repo, "file.txt"), "second", "utf8");
  await execa("git", ["add", "file.txt"], { cwd: repo });
  await execa("git", ["commit", "-q", "-m", "second"], { cwd: repo });

  reader = new ExecaGitReader(repo);
});

afterAll(() => rmSync(repo, { recursive: true, force: true }));

describe("ExecaGitReader (integration)", () => {
  it("returns firstCommitDate for a tracked file", async () => {
    const date = await reader.firstCommitDate("file.txt");
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("returns lastCommitDate for a tracked file (newer than or equal to first)", async () => {
    const first = await reader.firstCommitDate("file.txt");
    const last = await reader.lastCommitDate("file.txt");
    expect(last).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(first).not.toBeNull();
    expect(last).not.toBeNull();
    if (first !== null && last !== null) {
      expect(Date.parse(last)).toBeGreaterThanOrEqual(Date.parse(first));
    }
  });

  it("returns null when a file has no history", async () => {
    const date = await reader.firstCommitDate("does-not-exist.txt");
    expect(date).toBeNull();
  });

  it("returns lastCommitSha as 40-char hex", async () => {
    const sha = await reader.lastCommitSha();
    expect(sha).toMatch(/^[a-f0-9]{40}$/);
  });
});
