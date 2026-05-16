import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readResume, writeResume, type Resume } from "./storage.ts";

describe("storage", () => {
  let dir: string;
  let filePath: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "resume-builder-storage-"));
    filePath = join(dir, "resume.json");
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  test("roundtrip: write then read returns the same data", async () => {
    const sample: Resume = {
      schemaVersion: 1,
      header: { name: "Test", items: [{ icon: "mail", text: "x@y.z" }] },
      sections: [{ id: "exp", type: "timeline", items: [] }],
    };
    await writeResume(filePath, sample);
    const got = await readResume(filePath);
    expect(got).toEqual(sample);
  });

  test("readResume on missing file returns sensible default", async () => {
    const got = await readResume(filePath);
    expect(got).toEqual({
      schemaVersion: 1,
      header: { name: "", items: [] },
      sections: [],
    });
  });

  test("readResume on invalid JSON surfaces the parse error", async () => {
    await writeFile(filePath, "not valid json {", "utf-8");
    await expect(readResume(filePath)).rejects.toThrow();
  });

  test("writeResume creates parent directory if missing", async () => {
    const nested = join(dir, "a", "b", "resume.json");
    const sample: Resume = {
      schemaVersion: 1,
      header: { name: "X", items: [] },
      sections: [],
    };
    await writeResume(nested, sample);
    const got = await readResume(nested);
    expect(got).toEqual(sample);
  });

  test("default-on-missing is a fresh clone (not shared mutable state)", async () => {
    const a = await readResume(filePath);
    a.header.name = "mutated";
    const b = await readResume(filePath);
    expect(b.header.name).toBe("");
  });
});
