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
  .regex(/^[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*)*$/, {
    message: "mergePath must be dot-separated identifiers",
  });

export const HookEntrySchema = BaseEntrySchema.extend({
  kind: z.literal("hook"),
  snippetFile: SnippetFileSchema,
  mergeTarget: z.literal("settings.json"),
  mergePath: MergePathSchema,
  strategy: z.enum(["append", "replace"]),
}).strict();

export type HookEntry = z.infer<typeof HookEntrySchema>;
