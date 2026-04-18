# @clawforge/schema

Zod schemas and TypeScript types for the clawforge registry.

## Install

```bash
pnpm add @clawforge/schema
```

## Usage

```ts
import { parseEntry, EntrySchema } from "@clawforge/schema";

const entry = parseEntry(JSON.parse(await fs.readFile("entry.json", "utf8")));
// entry is narrowed by its discriminator: SkillEntry | AgentEntry | ...

// Or use the schema directly for non-throwing validation:
const result = EntrySchema.safeParse(input);
```

### Namespace IDs

```ts
import { parseId, formatId } from "@clawforge/schema";

parseId("skill:tdd-workflow");
// → { kind: "skill", user: null, name: "tdd-workflow" }

formatId({ kind: "agent", user: "sabahattink", name: "code-reviewer" });
// → "agent:@sabahattink/code-reviewer"
```

## Supported kinds

| Kind | Schema |
|---|---|
| `skill` | `SkillEntrySchema` |
| `agent` | `AgentEntrySchema` |
| `cmd` | `CommandEntrySchema` |
| `hook` | `HookEntrySchema` |
| `mcp` | `McpEntrySchema` |
| `preset` | `PresetEntrySchema` |

All are joined into `EntrySchema` (discriminated on `kind`).

## Stability

Breaking changes are released as major bumps. See [the clawforge design spec](../../docs/superpowers/specs/2026-04-18-clawforge-design.md).

License: MIT.
