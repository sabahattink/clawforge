import { KINDS, type Kind, SLUG_PATTERN, USER_HANDLE_PATTERN } from "./constants.js";

export type ParsedId = {
  kind: Kind;
  user: string | null;
  name: string;
};

const GLOBAL_RE = /^([a-z]+):([a-z][a-z0-9-]{0,63})$/;
const SCOPED_RE = /^([a-z]+):@([a-zA-Z0-9][a-zA-Z0-9-]{0,38})\/([a-z][a-z0-9-]{0,63})$/;

export function parseId(id: string): ParsedId {
  const scoped = SCOPED_RE.exec(id);
  if (scoped) {
    // Destructuring defaults keep TS happy under noUncheckedIndexedAccess;
    // the regex guarantees non-empty captures, so the defaults never trigger.
    const [, kindRaw = "", user = "", name = ""] = scoped;
    assertKind(kindRaw);
    return { kind: kindRaw, user, name };
  }

  const global = GLOBAL_RE.exec(id);
  if (global) {
    const [, kindRaw = "", name = ""] = global;
    assertKind(kindRaw);
    return { kind: kindRaw, user: null, name };
  }

  throw new Error(`invalid id: ${id}`);
}

export function formatId(parsed: ParsedId): string {
  if (!SLUG_PATTERN.test(parsed.name)) {
    throw new Error(`invalid name slug: ${parsed.name}`);
  }
  if (parsed.user !== null) {
    if (!USER_HANDLE_PATTERN.test(parsed.user)) {
      throw new Error(`invalid user handle: ${parsed.user}`);
    }
    return `${parsed.kind}:@${parsed.user}/${parsed.name}`;
  }
  return `${parsed.kind}:${parsed.name}`;
}

function assertKind(value: string | undefined): asserts value is Kind {
  if (value === undefined || !(KINDS as readonly string[]).includes(value)) {
    throw new Error(`unknown kind: ${value}`);
  }
}
