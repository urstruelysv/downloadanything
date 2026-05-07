import { Hono } from "hono";
import { z } from "zod";
import { ytdlpExtract, runDownload } from "./extractor.js";
import { uploadToR2 } from "./r2.js";

const STREAM_LIMIT_BYTES = 50 * 1024 * 1024;

export function createWorkerApp(token: string) {
  const app = new Hono();

  app.use("*", async (c, next) => {
    if (c.req.path === "/healthz") return next();
    const auth = c.req.header("authorization");
    const parsed = auth?.startsWith("Bearer ") ? auth.slice(7) : c.req.header("x-worker-token");
    if (parsed !== token) return c.json({ error: "unauthorized" }, 401);
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
    title: z.string().optional(),
    ext: z.string().optional(),
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
        body.title,
        body.ext,
      );

      if (sizeBytes !== undefined && sizeBytes > STREAM_LIMIT_BYTES) {
        const key = `dl/${Date.now()}-${crypto.randomUUID()}/${filename}`;
        const url = await uploadToR2(key, stream, contentType);
        return c.json({ r2Url: url });
      }

      const headers: Record<string, string> = {
        "content-type": contentType,
        "content-disposition": `attachment; filename="${filename}"`,
      };
      if (sizeBytes !== undefined) headers["content-length"] = String(sizeBytes);
      return new Response(stream as any, { status: 200, headers });
    } catch (e: any) {
      const code = e?.code ?? "degraded";
      const status = e?.httpStatus ?? 502;
      return c.json({ error: code, message: e?.message }, status);
    }
  });

  return app;
}
