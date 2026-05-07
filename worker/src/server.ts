import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { z } from "zod";
import { ytdlpExtract, runDownload } from "./extractor.js";
import { uploadToR2 } from "./r2.js";

const app = new Hono();

const TOKEN = process.env.WORKER_TOKEN;
if (!TOKEN) {
  console.error("FATAL: WORKER_TOKEN not set");
  process.exit(1);
}

const STREAM_LIMIT_BYTES = 50 * 1024 * 1024;

app.use("*", async (c, next) => {
  if (c.req.path === "/healthz") return next();
  const auth = c.req.header("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : c.req.header("x-worker-token");
  if (token !== TOKEN) return c.json({ error: "unauthorized" }, 401);
  return next();
});

app.get("/healthz", (c) => c.json({ ok: true }));

const ExtractBody = z.object({ url: z.string().url() });

app.post("/extract", async (c) => {
  let body;
  try {
    body = ExtractBody.parse(await c.req.json());
  } catch {
    return c.json({ error: "invalid_url" }, 400);
  }
  try {
    const result = await ytdlpExtract(body.url);
    return c.json(result);
  } catch (e: any) {
    const code = e?.code ?? "degraded";
    const status = e?.httpStatus ?? 502;
    return c.json({ error: code, message: e?.message }, status);
  }
});

const DownloadBody = z.object({
  url: z.string().url(),
  formatId: z.string().min(1),
});

app.post("/download", async (c) => {
  let body;
  try {
    body = DownloadBody.parse(await c.req.json());
  } catch {
    return c.json({ error: "invalid_request" }, 400);
  }
  try {
    const { stream, contentType, filename, sizeBytes } = await runDownload(
      body.url,
      body.formatId,
    );

    if (sizeBytes !== undefined && sizeBytes <= STREAM_LIMIT_BYTES) {
      return new Response(stream as any, {
        status: 200,
        headers: {
          "content-type": contentType,
          "content-disposition": `attachment; filename="${filename}"`,
          "content-length": String(sizeBytes),
        },
      });
    }

    const key = `dl/${Date.now()}-${crypto.randomUUID()}/${filename}`;
    const url = await uploadToR2(key, stream, contentType);
    return c.json({ r2Url: url });
  } catch (e: any) {
    const code = e?.code ?? "degraded";
    const status = e?.httpStatus ?? 502;
    return c.json({ error: code, message: e?.message }, status);
  }
});

const port = Number(process.env.PORT ?? 8080);
serve({ fetch: app.fetch, port });
console.log(`worker listening on :${port}`);
