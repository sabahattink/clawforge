export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: BuildError };

export type BuildError = {
  code: string;
  message: string;
  path?: string;
  cause?: unknown;
};

export function isOk<T>(r: Result<T>): r is { ok: true; value: T } {
  return r.ok;
}

export function isErr<T>(r: Result<T>): r is { ok: false; error: BuildError } {
  return !r.ok;
}
