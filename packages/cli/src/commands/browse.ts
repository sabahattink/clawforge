export type BrowseOptions = {
  webBase?: string;
  open?: (url: string) => void;
};

export function browseCommand(opts: BrowseOptions = {}): string {
  const base = opts.webBase ?? "https://clawforge.dev";
  const url = `${base.replace(/\/$/, "")}/browse`;
  if (opts.open !== undefined) opts.open(url);
  return url;
}
