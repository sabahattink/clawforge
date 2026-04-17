import { z } from "zod";
import { BaseEntrySchema } from "./common.js";
import { FileMappingSchema } from "./skill.js";

export const CommandEntrySchema = BaseEntrySchema.extend({
  kind: z.literal("cmd"),
  files: z.array(FileMappingSchema).min(1),
  invocation: z.string().regex(/^\/[a-z][a-z0-9-]{0,63}$/, "must start with '/' and be kebab-case"),
}).strict();

export type CommandEntry = z.infer<typeof CommandEntrySchema>;
