import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
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
    // Force the ES-bootstrap path into clone fallback so the resume
    // round-trip tests are deterministic without mocking DeepL.
    vi.stubEnv("DEEPL_API_KEY", "");
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
    vi.unstubAllEnvs();
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

describe("POST /translate", () => {
  let dir: string;
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "resume-builder-translate-"));
    app = createApp(dir);
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  test("returns 200 with translated text on success", async () => {
    vi.stubEnv("DEEPL_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              translations: [{ text: "Hola, mundo" }],
            }),
            {
              status: 200,
              headers: { "content-type": "application/json" },
            },
          ),
      ),
    );

    const res = await app.request("/translate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "Hello, world", targetLocale: "es" }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ translated: "Hola, mundo" });
  });

  test("returns 503 when DEEPL_API_KEY is unset", async () => {
    vi.stubEnv("DEEPL_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await app.request("/translate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "Hello", targetLocale: "es" }),
    });
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "translation_unavailable" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("returns 503 when DeepL returns an error", async () => {
    vi.stubEnv("DEEPL_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response("quota exceeded", {
            status: 456,
            headers: { "content-type": "text/plain" },
          }),
      ),
    );

    const res = await app.request("/translate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "Hello", targetLocale: "es" }),
    });
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "translation_failed" });
  });

  test("returns 400 when text is missing", async () => {
    vi.stubEnv("DEEPL_API_KEY", "test-key");
    const res = await app.request("/translate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ targetLocale: "es" }),
    });
    expect(res.status).toBe(400);
  });

  test("returns 400 when targetLocale is invalid", async () => {
    vi.stubEnv("DEEPL_API_KEY", "test-key");
    const res = await app.request("/translate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "Hello", targetLocale: "fr" }),
    });
    expect(res.status).toBe(400);
  });

  test("returns 400 on invalid JSON", async () => {
    vi.stubEnv("DEEPL_API_KEY", "test-key");
    const res = await app.request("/translate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not json",
    });
    expect(res.status).toBe(400);
  });
});

describe("GET /overrides and POST /overrides", () => {
  let dir: string;
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "resume-builder-overrides-app-"));
    app = createApp(dir);
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  test("GET /overrides returns empty object when no file exists", async () => {
    const res = await app.request("/overrides");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ overrides: {} });
  });

  test("POST /overrides persists a locked path", async () => {
    const postRes = await app.request("/overrides", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: "section:exp:item:abc:subtitle", locked: true }),
    });
    expect(postRes.status).toBe(200);
    expect(await postRes.json()).toEqual({ ok: true });

    const getRes = await app.request("/overrides");
    expect(await getRes.json()).toEqual({
      overrides: { "section:exp:item:abc:subtitle": true },
    });
  });

  test("POST /overrides locked:false removes the path", async () => {
    await app.request("/overrides", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: "section:exp:item:abc:subtitle", locked: true }),
    });
    await app.request("/overrides", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: "section:exp:item:abc:subtitle", locked: false }),
    });

    const getRes = await app.request("/overrides");
    expect(await getRes.json()).toEqual({ overrides: {} });
  });

  test("POST /overrides without path returns 400", async () => {
    const res = await app.request("/overrides", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locked: true }),
    });
    expect(res.status).toBe(400);
  });

  test("POST /overrides without locked returns 400", async () => {
    const res = await app.request("/overrides", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path: "some:path" }),
    });
    expect(res.status).toBe(400);
  });

  test("POST /overrides with invalid JSON returns 400", async () => {
    const res = await app.request("/overrides", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not json",
    });
    expect(res.status).toBe(400);
  });
});
