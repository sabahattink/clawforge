import { z } from "zod";
import { BaseEntrySchema } from "./common.js";

const SnippetFileSchema = z
  .string()
  .min(1)
  .refine((v) => !v.startsWith("/") && !v.includes("..") && !v.includes("\\"), {
    message: "snippetFile must be a relative path without '..' or backslashes",
  });

const MergePathSchema = z
  .string()
  .min(1)
  .regex(
    /^[a-zA-Z_$][a-zA-Z0-9_$]*(\.([a-zA-Z_$][a-zA-Z0-9_$]*|\{\{name\}\}))*$/,
    { message: "mergePath must be dot-separated identifiers or {{name}} token" },
  );

const EnvVarSchema = z
  .object({
    name: z.string().regex(/^[A-Z][A-Z0-9_]*$/, "env name must be SCREAMING_SNAKE_CASE"),
    required: z.boolean(),
    description: z.string().min(1).max(200),
  })
  .strict();

export const McpEntrySchema = BaseEntrySchema.extend({
  kind: z.literal("mcp"),
  snippetFile: SnippetFileSchema,
  mergeTarget: z.literal("settings.json"),
  mergePath: MergePathSchema,
  envVars: z.array(EnvVarSchema).optional(),
}).strict();

export type McpEntry = z.infer<typeof McpEntrySchema>;
