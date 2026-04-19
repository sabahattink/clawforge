import type { Entry, RegistryIndex } from "@clawforge/schema";
import { type CacheOptions, readCached, writeCache } from "./cache.js";

export type RegistryClient = {
  fetchIndex(): Promise<RegistryIndex>;
  fetchEntry(detailUrl: string): Promise<Entry>;
  fetchFile(url: string): Promise<Buffer>;
};

export type HttpClientOptions = {
  cdnBase: string;
  cacheDir?: string;
  noCache?: boolean;
  fetchImpl?: typeof fetch;
};

function urlJoin(base: string, path: string): string {
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export class HttpRegistryClient implements RegistryClient {
  private readonly fetchImpl: typeof fetch;
  private readonly cacheOpts: CacheOptions;

  constructor(private readonly opts: HttpClientOptions) {
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.cacheOpts = opts.cacheDir !== undefined ? { cacheDir: opts.cacheDir } : {};
  }

  async fetchIndex(): Promise<RegistryIndex> {
    const url = urlJoin(this.opts.cdnBase, "registry.json");
    const buf = await this.getBuffer(url);
    return JSON.parse(buf.toString("utf8")) as RegistryIndex;
  }

  async fetchEntry(detailUrl: string): Promise<Entry> {
    const buf = await this.getBuffer(detailUrl);
    return JSON.parse(buf.toString("utf8")) as Entry;
  }

  async fetchFile(url: string): Promise<Buffer> {
    return this.getBuffer(url);
  }

  private async getBuffer(url: string): Promise<Buffer> {
    if (this.opts.noCache !== true) {
      const cached = await readCached(url, this.cacheOpts);
      if (cached !== null) return cached;
    }
    let response: Response;
    try {
      response = await this.fetchImpl(url);
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : String(cause);
      throw new Error(
        `cannot reach ${url}: ${reason}. If the registry is at a different URL, pass --registry <url>.`,
        { cause },
      );
    }
    if (!response.ok) {
      throw new Error(`fetch failed: ${response.status} ${response.statusText} for ${url}`);
    }
    const arrayBuf = await response.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    if (this.opts.noCache !== true) {
      await writeCache(url, buf, this.cacheOpts);
    }
    return buf;
  }
}
