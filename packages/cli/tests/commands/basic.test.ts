import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { browseCommand } from "../../src/commands/browse.js";
import { doctorCommand } from "../../src/commands/doctor.js";
import { initCommand } from "../../src/commands/init.js";
import { listCommand } from "../../src/commands/list.js";
import { removeCommand } from "../../src/commands/remove.js";

let home: string;
beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), "clawforge-cmd-"));
});
afterEach(() => rmSync(home, { recursive: true, force: true }));

describe("initCommand", () => {
  it("creates an empty manifest at resolved path", async () => {
    const r = await initCommand({ scope: "global", home });
    expect(r.created).toBe(true);
    expect(existsSync(r.manifestPath)).toBe(true);
  });
});

describe("listCommand", () => {
  it("returns empty list when manifest missing", async () => {
    const records = await listCommand({ scope: "global", home });
    expect(records).toEqual([]);
  });

  it("returns installed records after init", async () => {
    await initCommand({ scope: "global", home });
    const records = await listCommand({ scope: "global", home });
    expect(records).toEqual([]);
  });
});

describe("removeCommand", () => {
  it("returns found:false when id not in manifest", async () => {
    await initCommand({ scope: "global", home });
    const r = await removeCommand({ id: "skill:missing", scope: "global", home, dryRun: false });
    expect(r.found).toBe(false);
  });
});

describe("doctorCommand", () => {
  it("reports total=0 when nothing installed", async () => {
    await initCommand({ scope: "global", home });
    const report = await doctorCommand({ scope: "global", home });
    expect(report.total).toBe(0);
    expect(report.missingFiles).toEqual([]);
  });
});

describe("browseCommand", () => {
  it("returns default URL", () => {
    expect(browseCommand()).toBe("https://clawforge.dev/browse");
  });

  it("invokes open when provided", () => {
    const opened: string[] = [];
    browseCommand({
      open: (u) => {
        opened.push(u);
      },
      webBase: "https://x.dev/",
    });
    expect(opened).toEqual(["https://x.dev/browse"]);
  });
});
