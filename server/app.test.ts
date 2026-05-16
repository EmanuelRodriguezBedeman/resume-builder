import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "./app.ts";
import type { Resume } from "./storage.ts";

describe("app integration", () => {
  let dir: string;
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "resume-builder-app-"));
    app = createApp(join(dir, "resume.json"));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  test("GET /health returns ok", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  test("GET /resume on first run returns the default Resume", async () => {
    const res = await app.request("/resume");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { resume: Resume };
    expect(body.resume).toEqual({
      schemaVersion: 1,
      header: { name: "", items: [] },
      sections: [],
    });
  });

  test("POST then GET roundtrip preserves the Resume", async () => {
    const sample: Resume = {
      schemaVersion: 1,
      header: { name: "Test User", items: [{ icon: "mail", text: "x@y.z" }] },
      sections: [{ id: "exp", type: "timeline", items: [] }],
    };

    const postRes = await app.request("/resume", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ resume: sample }),
    });
    expect(postRes.status).toBe(200);
    expect(await postRes.json()).toEqual({ ok: true });

    const getRes = await app.request("/resume");
    expect(getRes.status).toBe(200);
    const body = (await getRes.json()) as { resume: Resume };
    expect(body.resume).toEqual(sample);
  });

  test("POST without resume field returns 400", async () => {
    const res = await app.request("/resume", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
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
