# @clawmart/build-index

Builds CDN-ready artefacts from the clawmart registry tree.

## Usage (CLI)

```bash
clawmart-build-index \
  --registry ./registry \
  --out ./dist \
  --cdn-base https://cdn.clawmart.dev \
  --site-base https://clawmart.dev
```

Outputs (inside `--out`):

- `registry.json` — full index
- `skills.json`, `agents.json`, `commands.json`, `hooks.json`, `mcp.json`, `presets.json` — per-kind shards
- `sitemap.xml`, `feed.xml`
- `tombstones.json`

## Usage (programmatic)

```ts
import { buildIndex, ExecaGitReader } from "@clawmart/build-index";

const result = await buildIndex({
  registryRoot: "./registry",
  distDir: "./dist",
  cdnBase: "https://cdn.clawmart.dev",
  siteBase: "https://clawmart.dev",
  generatedAt: new Date().toISOString(),
  git: new ExecaGitReader(process.cwd()),
});
```

## CI requirement

`actions/checkout@v4` must set `fetch-depth: 0` so that `git log` can resolve `createdAt` / `updatedAt` / `sourceCommit`.

License: MIT.
