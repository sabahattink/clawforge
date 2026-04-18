export function getPath(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function setPath(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const parts = path.split(".");
  const last = parts[parts.length - 1];
  if (last === undefined) return obj;
  const out = structuredClone(obj) as Record<string, unknown>;

  let cursor: Record<string, unknown> = out;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    if (part === undefined) continue;
    const next = cursor[part];
    if (next === undefined || next === null || typeof next !== "object") {
      const fresh: Record<string, unknown> = {};
      cursor[part] = fresh;
      cursor = fresh;
    } else {
      cursor = next as Record<string, unknown>;
    }
  }
  cursor[last] = value;
  return out;
}

export function deletePath(
  obj: Record<string, unknown>,
  path: string,
): Record<string, unknown> {
  const parts = path.split(".");
  const last = parts[parts.length - 1];
  if (last === undefined) return obj;
  const out = structuredClone(obj) as Record<string, unknown>;

  const stack: Array<{ parent: Record<string, unknown>; key: string }> = [];
  let cursor: Record<string, unknown> = out;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    if (part === undefined) continue;
    const next = cursor[part];
    if (next === undefined || next === null || typeof next !== "object") return out;
    stack.push({ parent: cursor, key: part });
    cursor = next as Record<string, unknown>;
  }
  delete cursor[last];

  // prune empty parents
  while (stack.length > 0) {
    const frame = stack.pop();
    if (frame === undefined) break;
    const child = frame.parent[frame.key] as Record<string, unknown> | undefined;
    if (child !== undefined && Object.keys(child).length === 0) {
      delete frame.parent[frame.key];
    } else {
      break;
    }
  }
  return out;
}
