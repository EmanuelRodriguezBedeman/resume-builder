import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import {
  readBothLocales,
  readResume,
  writeJdResume,
  writeLocale,
  type Locale,
  type Resume,
} from "./storage.ts";
import type { Resume as ResumeData } from "../src/types.ts";
import { buildResumeDocx } from "./docx.ts";
import {
  MissingDeepLKeyError,
  translateText,
} from "./translate.ts";
import { readOverrides, writeOverride } from "./overrides.ts";
import { getProvider } from "./jd/provider.ts";
import {
  AiRequestError,
  generateTailoredResume,
  InvalidAiResponseError,
  ProviderUnconfiguredError,
} from "./jd/generate.ts";

const ENVELOPE_SCHEMA_VERSION = 1;

function isLocale(v: unknown): v is Locale {
  return v === "en" || v === "es";
}

export function createApp(dataDir: string) {
  const app = new Hono();

  app.get("/health", (c) => c.json({ ok: true }));

  // Health check for the Resume by JD feature: lets the frontend know whether
  // an AI provider is configured before showing the generation UI (see
  // docs/adr/0005-jd-ai-provider.md). No generation logic yet.
  app.get("/jd/provider-status", (c) => {
    const provider = getProvider();
    return c.json({
      configured: provider !== null,
      provider: provider?.type ?? null,
    });
  });

  // Tailor the resume to a job description via the configured AI provider and
  // persist the result to data/jd/resume.json. The EN locale is the source of
  // structure and Shared fields; output locale is the caller's choice or, when
  // omitted, auto-detected by the AI from the JD.
  app.post("/jd/generate", async (c) => {
    let body: { jd?: unknown; locale?: unknown };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "invalid_json" }, 400);
    }
    if (typeof body.jd !== "string" || !body.jd.trim()) {
      return c.json({ error: "missing_jd" }, 400);
    }
    if (body.locale !== undefined && !isLocale(body.locale)) {
      return c.json({ error: "invalid_locale" }, 400);
    }

    try {
      const resumeEn = (await readResume(dataDir, "en")) as ResumeData;
      const result = await generateTailoredResume(
        resumeEn,
        body.jd,
        body.locale,
      );
      await writeJdResume(dataDir, result.resume);
      return c.json({ resume: result.resume, locale: result.locale });
    } catch (err) {
      if (err instanceof ProviderUnconfiguredError) {
        return c.json({ error: "provider_unconfigured" }, 503);
      }
      if (err instanceof InvalidAiResponseError) {
        return c.json({ error: "invalid_ai_response" }, 422);
      }
      if (err instanceof AiRequestError) {
        console.error("[server] /jd/generate AI request failed:", err);
        return c.json({ error: "ai_request_failed" }, 502);
      }
      console.error("[server] /jd/generate failed:", err);
      return c.json({ error: "generate_failed" }, 500);
    }
  });

  app.get("/resume", async (c) => {
    try {
      const locales = await readBothLocales(dataDir);
      return c.json({ schemaVersion: ENVELOPE_SCHEMA_VERSION, locales });
    } catch (err) {
      console.error("[server] readBothLocales failed:", err);
      return c.json({ error: "read_failed" }, 500);
    }
  });

  app.post("/resume", async (c) => {
    let body: { locale?: unknown; resume?: Resume };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "invalid_json" }, 400);
    }
    if (!isLocale(body.locale)) {
      return c.json({ error: "invalid_locale" }, 400);
    }
    if (!body.resume) {
      return c.json({ error: "missing_resume_field" }, 400);
    }
    try {
      await writeLocale(dataDir, body.locale, body.resume);
      return c.json({ ok: true });
    } catch (err) {
      console.error("[server] writeLocale failed:", err);
      return c.json({ error: "write_failed" }, 500);
    }
  });

  app.get("/overrides", async (c) => {
    try {
      const overrides = await readOverrides(dataDir);
      return c.json({ overrides });
    } catch (err) {
      console.error("[server] readOverrides failed:", err);
      return c.json({ error: "read_failed" }, 500);
    }
  });

  app.post("/overrides", async (c) => {
    let body: { path?: unknown; locked?: unknown };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "invalid_json" }, 400);
    }
    if (typeof body.path !== "string" || !body.path) {
      return c.json({ error: "missing_path" }, 400);
    }
    if (typeof body.locked !== "boolean") {
      return c.json({ error: "missing_locked" }, 400);
    }
    try {
      await writeOverride(dataDir, body.path, body.locked);
      return c.json({ ok: true });
    } catch (err) {
      console.error("[server] writeOverride failed:", err);
      return c.json({ error: "write_failed" }, 500);
    }
  });

  app.post("/translate", async (c) => {
    let body: { text?: unknown; targetLocale?: unknown };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "invalid_json" }, 400);
    }
    if (typeof body.text !== "string") {
      return c.json({ error: "missing_text" }, 400);
    }
    if (!isLocale(body.targetLocale)) {
      return c.json({ error: "invalid_target_locale" }, 400);
    }
    try {
      const translated = await translateText(body.text, body.targetLocale);
      return c.json({ translated });
    } catch (err) {
      if (err instanceof MissingDeepLKeyError) {
        console.warn(
          "[server] /translate called but DEEPL_API_KEY is not set",
        );
        return c.json({ error: "translation_unavailable" }, 503);
      }
      console.error("[server] DeepL translation failed:", err);
      return c.json({ error: "translation_failed" }, 503);
    }
  });

  app.post("/docx", async (c) => {
    let body: { locale?: unknown };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "invalid_json" }, 400);
    }
    if (!isLocale(body.locale)) {
      return c.json({ error: "invalid_locale" }, 400);
    }
    try {
      // storage.Resume is intentionally loose (unknown[] items/sections); the
      // on-disk JSON conforms to the full src/types.ts schema the builder needs.
      const resume = (await readResume(dataDir, body.locale)) as ResumeData;
      const buffer = await buildResumeDocx(resume, body.locale);
      return new Response(buffer, {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="resume_${body.locale}.docx"`,
        },
      });
    } catch (err) {
      console.error("[server] buildResumeDocx failed:", err);
      return c.json({ error: "docx_failed" }, 500);
    }
  });

  // Serve the built Vite frontend in production. In dev Vite runs on a
  // separate port and proxies /resume here, so skipping these handlers
  // also keeps the "./dist not found" warning out of the dev log.
  if (process.env["NODE_ENV"] === "production") {
    app.use("/*", serveStatic({ root: "./dist" }));
    app.get("*", serveStatic({ path: "./dist/index.html" }));
  }

  return app;
}
