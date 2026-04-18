import { readFile } from "node:fs/promises";
import type { Result } from "../types.js";

export async function readJson<T = unknown>(path: string): Promise<Result<T>> {
  let raw: string;
  try {
    raw = await readFile(path, "utf8");
  } catch (cause) {
    return {
      ok: false,
      error: { code: "IO_READ", message: `failed to read ${path}`, path, cause },
    };
  }
  try {
    return { ok: true, value: JSON.parse(raw) as T };
  } catch (cause) {
    return {
      ok: false,
      error: { code: "JSON_PARSE", message: `invalid JSON at ${path}`, path, cause },
    };
  }
}
