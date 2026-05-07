import { detect } from "@/lib/platform";
import { ExtractError } from "./errors";
import type { ExtractResult } from "./types";

export { ExtractError } from "./errors";
export type { ExtractResult, Format, ExtractItem, Delivery } from "./types";

const MAX_RETRIES = 2;

function workerConfig() {
  const url = process.env.WORKER_URL;
  const token = process.env.WORKER_TOKEN;
  if (!url || !token) {
    throw new ExtractError("degraded", 503, "Worker not configured");
  }
  return { url, token };
}

async function workerFetch(
  path: string,
  body: Record<string, unknown>,
): Promise<Response> {
  const { url, token } = workerConfig();
  const res = await fetch(`${url}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ExtractError(
      data.error ?? "degraded",
      res.status,
      data.message,
    );
  }
  return res;
}

async function retry<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i <= MAX_RETRIES; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (e instanceof ExtractError && e.httpStatus < 500) throw e;
      if (i < MAX_RETRIES)
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(3, i)));
    }
  }
  throw lastErr;
}

export async function extract(url: string): Promise<ExtractResult> {
  const det = detect(url);
  if (!det) throw new ExtractError("unsupported_platform", 400);

  return retry(async () => {
    const res = await workerFetch("/extract", { url });
    return (await res.json()) as ExtractResult;
  });
}

export type DownloadResult =
  | { kind: "stream"; body: ReadableStream; headers: Headers }
  | { kind: "r2"; r2Url: string }
  | { kind: "redirect"; directUrl: string };

export async function download(
  url: string,
  formatId: string,
  directUrl?: string,
): Promise<DownloadResult> {
  if (directUrl) {
    return { kind: "redirect", directUrl };
  }

  const res = await workerFetch("/download", { url, formatId });
  const ct = res.headers.get("content-type") ?? "";

  if (ct.includes("application/json")) {
    const body = (await res.json()) as { r2Url: string };
    return { kind: "r2", r2Url: body.r2Url };
  }

  const headers = new Headers(res.headers);
  headers.delete("authorization");
  return { kind: "stream", body: res.body!, headers };
}
