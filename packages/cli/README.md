# @clawmart/cli

The clawmart CLI — install Claude Code skills, agents, hooks, and MCP servers with one command.

## Install

```bash
npm install -g @clawmart/cli
# or
npx clawmart --help
```

## Commands

| Command | Description |
|---|---|
| `init` | Initialise a clawmart manifest in the chosen scope |
| `add <id>` | Install an entry (e.g. `skill:tdd-workflow`) |
| `list` | List installed entries from the manifest |
| `info <id>` | Show metadata for an entry |
| `search <query>` | Search the registry by name / tag / description |
| `remove <id>` | Uninstall an entry, reverting files and JSON merges |
| `update [id]` | Check for and apply updates to tracked entries |
| `doctor` | Verify installed entries against the manifest |
| `browse` | Print (or open) the clawmart web site URL |

## Global flags

| Flag | Purpose |
|---|---|
| `--scope <global\|project>` | Install scope (default depends on entry kind) |
| `--registry <url>` | Alternate registry CDN (default: `https://cdn.clawmart.dev`) |
| `--track` | Record installs in `.clawmart/manifest.json` so `update` / `remove` can manage them |
| `--force` | Auto-answer overwrite on file/JSON conflicts |
| `--dry-run` | Print the plan; write nothing |
| `--yes`, `-y` | Non-interactive; accept defaults for all prompts |
| `--json` | Machine-readable output |
| `--no-cache` | Bypass the 24-hour registry cache |

## Example

```bash
clawmart init
clawmart add skill:tdd-workflow --track
clawmart list
clawmart remove skill:tdd-workflow
```

## Scope defaults

- `skill`, `agent`, `hook`, `mcp` → `global` (`~/.claude/`)
- `cmd`, `preset` → `project` (`./.claude/`)
- Override with `--scope global` or `--scope project`.

## Reversibility

Every install records:

- Exact files written
- JSON merge `before` snapshot for `settings.json` paths
- `sha256` of the content artefact
- Source commit of the registry

`remove` uses these to cleanly restore state.

## Programmatic API

Every command is available as a function via `@clawmart/cli`:

```ts
import { addCommand, HttpRegistryClient } from "@clawmart/cli";

await addCommand({
  id: "skill:tdd-workflow",
  client: new HttpRegistryClient({ cdnBase: "https://cdn.clawmart.dev" }),
  track: true,
  force: false,
  dryRun: false,
  onPrompt: async () => "overwrite",
  downloadDir: "/tmp/clawmart-dl",
});
```

## Deferred for v2

- Preset (bundle) installer recursive fetch — design stubbed; currently errors if you try to add a `preset:`.
- MeiliSearch-backed fuzzy `search` (MVP uses local substring match over the cached index).
- Interactive `--yes`-overrideable prompt UX polish.

License: MIT.
