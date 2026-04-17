import { z } from "zod";

export const KINDS = ["skill", "agent", "hook", "mcp", "cmd", "preset"] as const;
export type Kind = (typeof KINDS)[number];

export const KindSchema = z.enum(KINDS);

export const SLUG_PATTERN = /^[a-z][a-z0-9-]{0,63}$/;
export const USER_HANDLE_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,38}$/;
export const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[a-zA-Z0-9.-]+)?(?:\+[a-zA-Z0-9.-]+)?$/;

export const RECOMMENDED_CATEGORIES = [
  "testing",
  "devops",
  "docs",
  "security",
  "debugging",
  "refactoring",
  "mobile",
  "backend",
  "frontend",
  "data",
  "ai-ml",
  "productivity",
  "other",
] as const;
