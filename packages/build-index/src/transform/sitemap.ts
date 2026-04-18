export type SitemapEntry = {
  kind: string;
  name: string;
  updatedAt: string;
};

export type SitemapInput = {
  siteBase: string;
  entries: readonly SitemapEntry[];
};

export function generateSitemap({ siteBase, entries }: SitemapInput): string {
  const base = siteBase.replace(/\/$/, "");
  const urls = entries.map((e) => {
    const loc = `${base}/${e.kind}/${escapeXml(e.name)}`;
    const lastmod = e.updatedAt.slice(0, 10);
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`;
  });
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
