import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { readResume, writeResume, type Resume } from "./storage.ts";

export function createApp(dataFile: string) {
  const app = new Hono();

  app.get("/health", (c) => c.json({ ok: true }));

  app.get("/resume", async (c) => {
    try {
      const resume = await readResume(dataFile);
      return c.json({ resume });
    } catch (err) {
      console.error("[server] readResume failed:", err);
      return c.json({ error: "read_failed" }, 500);
    }
  });

  app.post("/resume", async (c) => {
    let body: { resume?: Resume };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "invalid_json" }, 400);
    }
    if (!body.resume) {
      return c.json({ error: "missing_resume_field" }, 400);
    }
    try {
      await writeResume(dataFile, body.resume);
      return c.json({ ok: true });
    } catch (err) {
      console.error("[server] writeResume failed:", err);
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
