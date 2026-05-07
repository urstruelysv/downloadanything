import { serve } from "@hono/node-server";
import { createWorkerApp } from "./app.js";

const TOKEN = process.env.WORKER_TOKEN;
if (!TOKEN) {
  console.error("FATAL: WORKER_TOKEN not set");
  process.exit(1);
}

const app = createWorkerApp(TOKEN);
const port = Number(process.env.PORT ?? 8080);
serve({ fetch: app.fetch, port });
console.log(`worker listening on :${port}`);
