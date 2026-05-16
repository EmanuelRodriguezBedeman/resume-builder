import { serve } from "@hono/node-server";
import { join } from "node:path";
import { createApp } from "./app.ts";

const dataFile = join(process.cwd(), "data", "resume.json");
const app = createApp(dataFile);
const port = Number(process.env["PORT"] ?? 8787);

serve({ fetch: app.fetch, port }, ({ port }) => {
  console.log(`[server] listening on http://localhost:${port}`);
  console.log(`[server] data file: ${dataFile}`);
});
