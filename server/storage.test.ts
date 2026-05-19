import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  readBothLocales,
  writeLocale,
  type Resume,
} from "./storage.ts";

const EMPTY_RESUME: Resume = {
  schemaVersion: 1,
  header: { name: "", items: [] },
  sections: [],
};

describe("storage", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "resume-builder-storage-"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  test("readBothLocales returns both when both files exist", async () => {
    const en: Resume = {
      schemaVersion: 1,
      header: { name: "EN User", items: [] },
      sections: [],
    };
    const es: Resume = {
      schemaVersion: 1,
      header: { name: "ES User", items: [] },
      sections: [],
    };
    await writeLocale(dir, "en", en);
    await writeLocale(dir, "es", es);

    const got = await readBothLocales(dir);
    expect(got.en).toEqual(en);
    expect(got.es).toEqual(es);
  });

  test("readBothLocales clones EN→ES when resume_es.json is missing and persists it", async () => {
    const en: Resume = {
      schemaVersion: 1,
      header: { name: "Only EN", items: [] },
      sections: [{ id: "exp", type: "timeline", items: [] }],
    };
    await writeLocale(dir, "en", en);

    const got = await readBothLocales(dir);
    expect(got.es).toEqual(en);

    const esRaw = await readFile(join(dir, "resume_es.json"), "utf-8");
    expect(JSON.parse(esRaw)).toEqual(en);
  });

  test("readBothLocales on empty dir returns defaults for both locales", async () => {
    const got = await readBothLocales(dir);
    expect(got.en).toEqual(EMPTY_RESUME);
    expect(got.es).toEqual(EMPTY_RESUME);
  });

  test("readBothLocales surfaces parse errors on invalid JSON", async () => {
    await writeFile(join(dir, "resume_en.json"), "not valid json {", "utf-8");
    await expect(readBothLocales(dir)).rejects.toThrow();
  });

  test("writeLocale to en does not touch resume_es.json", async () => {
    const originalEs: Resume = {
      schemaVersion: 1,
      header: { name: "ORIGINAL ES", items: [] },
      sections: [],
    };
    await writeLocale(dir, "es", originalEs);

    const newEn: Resume = {
      schemaVersion: 1,
      header: { name: "NEW EN", items: [] },
      sections: [],
    };
    await writeLocale(dir, "en", newEn);

    const esRaw = await readFile(join(dir, "resume_es.json"), "utf-8");
    expect(JSON.parse(esRaw)).toEqual(originalEs);
  });

  test("writeLocale to es does not touch resume_en.json", async () => {
    const originalEn: Resume = {
      schemaVersion: 1,
      header: { name: "ORIGINAL EN", items: [] },
      sections: [],
    };
    await writeLocale(dir, "en", originalEn);

    const newEs: Resume = {
      schemaVersion: 1,
      header: { name: "NEW ES", items: [] },
      sections: [],
    };
    await writeLocale(dir, "es", newEs);

    const enRaw = await readFile(join(dir, "resume_en.json"), "utf-8");
    expect(JSON.parse(enRaw)).toEqual(originalEn);
  });

  test("writeLocale creates parent directory if missing", async () => {
    const nested = join(dir, "a", "b");
    const en: Resume = {
      schemaVersion: 1,
      header: { name: "Nested", items: [] },
      sections: [],
    };
    await writeLocale(nested, "en", en);

    const got = await readBothLocales(nested);
    expect(got.en).toEqual(en);
  });

  test("default-on-missing returns a fresh clone (not shared mutable state)", async () => {
    const a = await readBothLocales(dir);
    a.en.header.name = "mutated";
    // The previous read created and persisted resume_es.json (cloned from
    // default EN), so wipe the dir before a fresh second read.
    await rm(dir, { recursive: true, force: true });
    const dir2 = await mkdtemp(join(tmpdir(), "resume-builder-storage-"));
    const b = await readBothLocales(dir2);
    expect(b.en.header.name).toBe("");
    await rm(dir2, { recursive: true, force: true });
  });
});
