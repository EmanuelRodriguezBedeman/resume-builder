import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "./app.ts";
import type { Resume } from "./storage.ts";

const DOCX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

// A resume that exercises every section type so the builder runs end-to-end.
const SAMPLE_RESUME: Resume = {
  schemaVersion: 1,
  header: {
    name: "Ada Lovelace",
    items: [
      { id: "m", icon: "mail", text: "ada@analytical.engine" },
      { id: "p", icon: "phone", text: "+44 20 0000 0000" },
    ],
  },
  sections: [
    {
      id: "exp",
      title: "Experience",
      hidden: false,
      type: "timeline",
      items: [
        {
          id: "t1",
          title: "Mathematician",
          subtitle: "Analytical Engine Project",
          dateRange: { start: "1842-01", end: null },
          description: [
            { type: "paragraph", text: "Wrote the first algorithm." },
            { type: "bullet", text: "Bernoulli numbers", leadIn: "Notable" },
          ],
        },
      ],
    },
    {
      id: "edu",
      title: "Education",
      hidden: false,
      type: "compactGrid",
      items: [
        {
          id: "c1",
          title: "Self-taught",
          subtitle: "Mathematics",
          date: { start: "1832", end: "1842" },
        },
      ],
    },
    {
      id: "proj",
      title: "Projects",
      hidden: false,
      type: "showcase",
      items: [
        {
          id: "s1",
          title: "Note G",
          techStack: ["punch cards"],
          description: [{ type: "paragraph", text: "Computing program." }],
          links: [{ id: "l1", icon: "link", label: "Archive", href: "https://example.com" }],
        },
      ],
    },
    {
      id: "skills",
      title: "Skills",
      hidden: false,
      type: "categorizedTags",
      items: [{ id: "g1", category: "Math", tags: ["algebra", "calculus"] }],
    },
  ],
} as unknown as Resume;

describe("POST /docx", () => {
  let dir: string;
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "resume-builder-docx-"));
    app = createApp(dir);
    // Avoid the DeepL bootstrap path when resume_es.json is missing.
    vi.stubEnv("DEEPL_API_KEY", "");
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
    vi.unstubAllEnvs();
  });

  test("returns 200 with the .docx content type", async () => {
    await app.request("/resume", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale: "en", resume: SAMPLE_RESUME }),
    });

    const res = await app.request("/docx", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale: "en" }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe(DOCX_CONTENT_TYPE);

    const bytes = new Uint8Array(await res.arrayBuffer());
    // .docx is a ZIP archive — first two bytes are "PK".
    expect(bytes.length).toBeGreaterThan(0);
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
  });

  test("works for an empty resume (first run, no data on disk)", async () => {
    const res = await app.request("/docx", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale: "en" }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe(DOCX_CONTENT_TYPE);
  });

  test("returns 400 on invalid locale", async () => {
    const res = await app.request("/docx", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale: "fr" }),
    });
    expect(res.status).toBe(400);
  });

  test("returns 400 on invalid JSON", async () => {
    const res = await app.request("/docx", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not json",
    });
    expect(res.status).toBe(400);
  });
});
