import { createHash } from "node:crypto";

export function sha256Of(buffers: readonly Buffer[]): string {
  const hash = createHash("sha256");
  for (const buf of buffers) hash.update(buf);
  return hash.digest("hex");
}

export function verifyOrThrow(expected: string, actual: string): void {
  if (expected !== actual) {
    throw new Error(`sha256 mismatch: expected ${expected}, got ${actual}`);
  }
}
