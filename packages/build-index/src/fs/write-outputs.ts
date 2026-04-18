import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { RegistryIndex, RemovedIndex } from "@clawmart/schema";

const KIND_TO_FILENAME: Record<string, string> = {
  skill: "skills.json",
  agent: "agents.json",
  cmd: "commands.json",
  hook: "hooks.json",
  mcp: "mcp.json",
  preset: "presets.json",
};

export type WriteOutputsInput = {
  distDir: string;
  registryIndex: RegistryIndex;
  shards: Record<string, RegistryIndex>;
  sitemap: string;
  feed: string;
  tombstones: RemovedIndex;
};

export async function writeOutputs(input: WriteOutputsInput): Promise<void> {
  await mkdir(input.distDir, { recursive: true });
  await writeFile(
    join(input.distDir, "registry.json"),
    `${JSON.stringify(input.registryIndex, null, 2)}\n`,
    "utf8",
  );
  for (const [kind, shard] of Object.entries(input.shards)) {
    const filename = KIND_TO_FILENAME[kind];
    if (filename === undefined) continue;
    await writeFile(
      join(input.distDir, filename),
      `${JSON.stringify(shard, null, 2)}\n`,
      "utf8",
    );
  }
  await writeFile(join(input.distDir, "sitemap.xml"), input.sitemap, "utf8");
  await writeFile(join(input.distDir, "feed.xml"), input.feed, "utf8");
  await writeFile(
    join(input.distDir, "tombstones.json"),
    `${JSON.stringify(input.tombstones, null, 2)}\n`,
    "utf8",
  );
}
