export type FeedEntry = {
  kind: string;
  name: string;
  displayName: string;
  description: string;
  updatedAt: string;
};

export type FeedInput = {
  siteBase: string;
  entries: readonly FeedEntry[];
};

export function generateFeed({ siteBase, entries }: FeedInput): string {
  const base = siteBase.replace(/\/$/, "");
  const sorted = [...entries].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  const latest = sorted.slice(0, 50);
  const items = latest.map((e) => {
    const link = `${base}/${e.kind}/${esc(e.name)}`;
    const pubDate = new Date(e.updatedAt).toUTCString();
    return [
      "  <item>",
      `    <title>${esc(e.displayName)}</title>`,
      `    <link>${link}</link>`,
      `    <guid isPermaLink="true">${link}</guid>`,
      `    <pubDate>${pubDate}</pubDate>`,
      `    <description>${esc(e.description)}</description>`,
      "  </item>",
    ].join("\n");
  });
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<rss version="2.0">`,
    "<channel>",
    "  <title>clawmart — new entries</title>",
    `  <link>${base}</link>`,
    "  <description>Newly added entries to clawmart.</description>",
    ...items,
    "</channel>",
    "</rss>",
  ].join("\n");
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
