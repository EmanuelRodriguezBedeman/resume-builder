import { serve } from "@hono/node-server";
import { join } from "node:path";
import { createApp } from "./app.ts";

const dataDir = join(process.cwd(), "data");
const app = createApp(dataDir);
const port = Number(process.env["PORT"] ?? 8787);

serve({ fetch: app.fetch, port }, ({ port }) => {
  console.log(`[server] listening on http://localhost:${port}`);
  console.log(`[server] data dir: ${dataDir}`);
});
