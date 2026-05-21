import { serve } from "@hono/node-server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createApp } from "./app.ts";

// Load .env from project root if present (local dev without shell env setup).
// Silently ignored when the file doesn't exist (e.g. CI, production).
try {
  for (const line of readFileSync(".env", "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (key && !(key in process.env)) process.env[key] = val;
  }
} catch { /* .env not present — use process.env as-is */ }

const dataDir = join(process.cwd(), "data");
const app = createApp(dataDir);
const port = Number(process.env["PORT"] ?? 8787);

serve({ fetch: app.fetch, port }, ({ port }) => {
  console.log(`[server] listening on http://localhost:${port}`);
  console.log(`[server] data dir: ${dataDir}`);
});
