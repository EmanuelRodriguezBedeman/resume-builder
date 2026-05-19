import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "./app.ts";
import type { LocalesBundle, Resume } from "./storage.ts";

const EMPTY_RESUME: Resume = {
  schemaVersion: 1,
  header: { name: "", items: [] },
  sections: [],
};

describe("app integration", () => {
  let dir: string;
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "resume-builder-app-"));
    app = createApp(dir);
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  test("GET /health returns ok", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  test("GET /resume on first run returns envelope with default locales", async () => {
    const res = await app.request("/resume");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      schemaVersion: number;
      locales: LocalesBundle;
    };
    expect(body.schemaVersion).toBe(1);
    expect(body.locales.en).toEqual(EMPTY_RESUME);
    expect(body.locales.es).toEqual(EMPTY_RESUME);
  });

  test("POST { locale: 'en', resume } then GET returns it under locales.en", async () => {
    const sample: Resume = {
      schemaVersion: 1,
      header: { name: "Test User", items: [{ icon: "mail", text: "x@y.z" }] },
      sections: [{ id: "exp", type: "timeline", items: [] }],
    };

    const postRes = await app.request("/resume", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale: "en", resume: sample }),
    });
    expect(postRes.status).toBe(200);
    expect(await postRes.json()).toEqual({ ok: true });

    const getRes = await app.request("/resume");
    const body = (await getRes.json()) as { locales: LocalesBundle };
    expect(body.locales.en).toEqual(sample);
    // ES was missing on first read → cloned from EN per the Slice 1 placeholder.
    expect(body.locales.es).toEqual(sample);
  });

  test("POST { locale: 'es', resume } only writes resume_es.json", async () => {
    // First read seeds default EN and clones ES from it.
    await app.request("/resume");

    const esSample: Resume = {
      schemaVersion: 1,
      header: { name: "ES Edited", items: [] },
      sections: [],
    };
    const postRes = await app.request("/resume", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale: "es", resume: esSample }),
    });
    expect(postRes.status).toBe(200);

    const getRes = await app.request("/resume");
    const body = (await getRes.json()) as { locales: LocalesBundle };
    expect(body.locales.es).toEqual(esSample);
    expect(body.locales.en).toEqual(EMPTY_RESUME);
  });

  test("POST without locale returns 400", async () => {
    const res = await app.request("/resume", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ resume: EMPTY_RESUME }),
    });
    expect(res.status).toBe(400);
  });

  test("POST with invalid locale returns 400", async () => {
    const res = await app.request("/resume", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale: "fr", resume: EMPTY_RESUME }),
    });
    expect(res.status).toBe(400);
  });

  test("POST without resume field returns 400", async () => {
    const res = await app.request("/resume", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale: "en" }),
    });
    expect(res.status).toBe(400);
  });

  test("POST with invalid JSON returns 400", async () => {
    const res = await app.request("/resume", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not json",
    });
    expect(res.status).toBe(400);
  });
});
