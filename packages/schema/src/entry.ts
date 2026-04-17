import { z } from "zod";
import { AgentEntrySchema } from "./agent.js";
import { CommandEntrySchema } from "./command.js";
import { HookEntrySchema } from "./hook.js";
import { McpEntrySchema } from "./mcp.js";
import { PresetEntrySchema } from "./preset.js";
import { SkillEntrySchema } from "./skill.js";

// `discriminatedUnion` accepts only `ZodObject` options. Cross-field invariants
// that span kinds (e.g. "preset cannot include itself") are applied afterwards
// via `superRefine`, which wraps the union in `ZodEffects`. Consumers should
// use `EntrySchema` for parsing; the individual `*EntrySchema` exports remain
// `ZodObject` so they can compose into the union or be reused elsewhere.
const EntryUnion = z.discriminatedUnion("kind", [
  SkillEntrySchema,
  AgentEntrySchema,
  CommandEntrySchema,
  HookEntrySchema,
  McpEntrySchema,
  PresetEntrySchema,
]);

export const EntrySchema = EntryUnion.superRefine((entry, ctx) => {
  if (entry.kind === "preset" && entry.includes.includes(`preset:${entry.name}`)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "preset cannot include itself",
      path: ["includes"],
    });
  }
});

export type Entry = z.infer<typeof EntryUnion>;

export function parseEntry(input: unknown): Entry {
  const result = EntrySchema.safeParse(input);
  if (result.success) return result.data;
  const lines = result.error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "<root>";
    return `  - ${path}: ${issue.message}`;
  });
  throw new Error(`entry validation failed:\n${lines.join("\n")}`);
}
