import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readOverrides, writeOverride } from "./overrides.ts";

describe("overrides", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "resume-builder-overrides-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  test("readOverrides returns {} when file is missing", async () => {
    const result = await readOverrides(dir);
    expect(result).toEqual({});
  });

  test("writeOverride creates file and sets path to true", async () => {
    await writeOverride(dir, "section:exp:item:abc:subtitle", true);
    const result = await readOverrides(dir);
    expect(result).toEqual({ "section:exp:item:abc:subtitle": true });
  });

  test("writeOverride locked:false removes entry from map", async () => {
    await writeOverride(dir, "section:exp:item:abc:subtitle", true);
    await writeOverride(dir, "section:exp:item:abc:subtitle", false);
    const result = await readOverrides(dir);
    expect(result).toEqual({});
  });

  test("writeOverride locked:false on non-existent path leaves file empty", async () => {
    await writeOverride(dir, "section:exp:item:abc:subtitle", false);
    const result = await readOverrides(dir);
    expect(result).toEqual({});
  });

  test("toggle round-trip: lock, unlock, re-lock", async () => {
    const path = "header:title";
    await writeOverride(dir, path, true);
    expect(await readOverrides(dir)).toEqual({ [path]: true });

    await writeOverride(dir, path, false);
    expect(await readOverrides(dir)).toEqual({});

    await writeOverride(dir, path, true);
    expect(await readOverrides(dir)).toEqual({ [path]: true });
  });

  test("multiple paths are stored independently", async () => {
    await writeOverride(dir, "section:exp:item:abc:subtitle", true);
    await writeOverride(dir, "section:edu:item:xyz:subtitle", true);
    const result = await readOverrides(dir);
    expect(result).toEqual({
      "section:exp:item:abc:subtitle": true,
      "section:edu:item:xyz:subtitle": true,
    });
  });

  test("unlocking one path does not affect others", async () => {
    await writeOverride(dir, "section:exp:item:abc:subtitle", true);
    await writeOverride(dir, "section:edu:item:xyz:subtitle", true);
    await writeOverride(dir, "section:exp:item:abc:subtitle", false);
    const result = await readOverrides(dir);
    expect(result).toEqual({ "section:edu:item:xyz:subtitle": true });
  });

  test("file is written atomically (valid JSON)", async () => {
    await writeOverride(dir, "some:path", true);
    const raw = await readFile(join(dir, "translation-overrides.json"), "utf-8");
    expect(() => JSON.parse(raw)).not.toThrow();
  });
});
