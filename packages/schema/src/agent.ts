import { z } from "zod";
import { BaseEntrySchema } from "./common.js";
import { FileMappingSchema } from "./skill.js";

export const AgentEntrySchema = BaseEntrySchema.extend({
  kind: z.literal("agent"),
  files: z.array(FileMappingSchema).min(1),
  tools: z.array(z.string().min(1)).min(1).optional(),
  model: z.enum(["sonnet", "opus", "haiku"]).optional(),
}).strict();

export type AgentEntry = z.infer<typeof AgentEntrySchema>;
