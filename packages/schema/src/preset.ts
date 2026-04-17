import { z } from "zod";
import { BaseEntrySchema, IdReferenceSchema } from "./common.js";

const SnippetFileSchema = z
  .string()
  .min(1)
  .refine((v) => !v.startsWith("/") && !v.includes("..") && !v.includes("\\"), {
    message: "settingsPatch must be a relative path without '..' or backslashes",
  });

// Must remain a pure ZodObject (no top-level `.refine()`) so `z.discriminatedUnion`
// in src/entry.ts will accept it. The "preset cannot include itself" invariant
// is enforced at the union level via `superRefine`.
export const PresetEntrySchema = BaseEntrySchema.extend({
  kind: z.literal("preset"),
  includes: z
    .array(IdReferenceSchema)
    .min(1)
    .refine((arr) => new Set(arr).size === arr.length, {
      message: "includes must not contain duplicates",
    }),
  settingsPatch: SnippetFileSchema.optional(),
}).strict();

export type PresetEntry = z.infer<typeof PresetEntrySchema>;
