# @clawforge/web

The clawforge.dev Astro static site.

## Pages

- `/` — landing: hero, install command, featured, stats
- `/browse` — full grid with kind and verified filters
- `/[kind]/[slug]` — entry detail (SEO-critical, one page per entry)
- `/docs` — getting-started guide

Generated from `data/registry.json` at build time.

## Develop

```bash
pnpm --filter @clawforge/web dev
```

Visit http://localhost:4321.

## Build

```bash
pnpm --filter @clawforge/web build
```

Output lands in `apps/web/dist/`. Static HTML, ready to upload to Cloudflare Pages or any static host.

## Data source

For MVP the landing + browse + detail pages read from `apps/web/data/registry.json`. For prod, replace this file at build time by running `@clawforge/build-index` against the real registry:

```bash
pnpm --filter @clawforge/build-index build
node packages/build-index/dist/bin.js --registry ./registry --out apps/web/data
pnpm --filter @clawforge/web build
```

## Deferred for post-MVP

- `/submit`, `/stats`, `/author/:handle`, `/tag/:tag`, `/category/:cat` pages
- OG image generation via Satori
- MeiliSearch InstantSearch widget
- Sitemap/RSS (currently produced by `@clawforge/build-index` at the CDN root)

License: MIT.
