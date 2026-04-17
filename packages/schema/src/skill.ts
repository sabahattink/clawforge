import { z } from "zod";
import { BaseEntrySchema } from "./common.js";
import { SLUG_PATTERN } from "./constants.js";

const TEMPLATE_TOKEN_RE = /\{\{([A-Z_]+|name)\}\}/g;
const ALLOWED_TOKENS = new Set(["CLAUDE_DIR", "name"]);

const FileTargetSchema = z
  .string()
  .min(1)
  .refine((v) => !v.includes(".."), { message: "target must not contain .." })
  .refine(
    (v) => {
      const matches = [...v.matchAll(TEMPLATE_TOKEN_RE)].map((m) => m[1]);
      if (matches.length === 0) return false;
      return matches.every((t) => t !== undefined && ALLOWED_TOKENS.has(t));
    },
    {
      message: "target must use only {{CLAUDE_DIR}} and {{name}} tokens",
    },
  );

const FileSourceSchema = z
  .string()
  .min(1)
  .refine((v) => !v.startsWith("/") && !v.includes("..") && !v.includes("\\"), {
    message: "source must be relative path without '..' or backslashes",
  });

export const FileMappingSchema = z
  .object({
    source: FileSourceSchema,
    target: FileTargetSchema,
  })
  .strict();

export const SkillEntrySchema = BaseEntrySchema.extend({
  kind: z.literal("skill"),
  files: z.array(FileMappingSchema).min(1),
  activatesOn: z.array(z.string().regex(SLUG_PATTERN)).max(10).optional(),
}).strict();

export type SkillEntry = z.infer<typeof SkillEntrySchema>;
