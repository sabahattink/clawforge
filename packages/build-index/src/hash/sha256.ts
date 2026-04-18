import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function computeContentSha256(
  entryDir: string,
  relativeFiles: readonly string[],
): Promise<string> {
  const hash = createHash("sha256");
  for (const rel of relativeFiles) {
    const buf = await readFile(join(entryDir, rel));
    hash.update(buf);
  }
  return hash.digest("hex");
}
