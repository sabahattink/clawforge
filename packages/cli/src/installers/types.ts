import type { Entry } from "@clawforge/schema";
import type { JsonMergeRecord } from "../manifest/types.js";

export type PromptFn = (question: string, choices: string[]) => Promise<string>;

export type InstallerContext = {
  entry: Entry;
  entryDir: string;
  claudeDir: string;
  dryRun: boolean;
  force: boolean;
  onPrompt: PromptFn;
};

export type InstallResult = {
  files: string[];
  jsonMerges: JsonMergeRecord[];
  skipped: boolean;
  reason?: string;
};

export const emptyResult = (): InstallResult => ({ files: [], jsonMerges: [], skipped: false });
