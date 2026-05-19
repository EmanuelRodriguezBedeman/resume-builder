import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import {
  readBothLocales,
  writeLocale,
  type Locale,
  type Resume,
} from "./storage.ts";

const ENVELOPE_SCHEMA_VERSION = 1;

function isLocale(v: unknown): v is Locale {
  return v === "en" || v === "es";
}

export function createApp(dataDir: string) {
  const app = new Hono();

  app.get("/health", (c) => c.json({ ok: true }));

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

  // Serve the built Vite frontend in production. In dev Vite runs on a
  // separate port and proxies /resume here, so skipping these handlers
  // also keeps the "./dist not found" warning out of the dev log.
  if (process.env["NODE_ENV"] === "production") {
    app.use("/*", serveStatic({ root: "./dist" }));
    app.get("*", serveStatic({ path: "./dist/index.html" }));
  }

  return app;
}
