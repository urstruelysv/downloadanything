import type { ExtractResult } from "@/lib/types";
import { ExtractError } from "@/lib/extract/router";

const WORKER_URL = process.env.WORKER_URL;
const WORKER_TOKEN = process.env.WORKER_TOKEN;

function assertEnv(): void {
  if (!WORKER_URL || !WORKER_TOKEN) {
    throw new ExtractError("degraded", 503, "Worker not configured");
  }
}

export async function workerExtract(url: string): Promise<ExtractResult> {
  assertEnv();
  const res = await fetch(`${WORKER_URL}/extract`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-worker-token": WORKER_TOKEN!,
    },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ExtractError(body.error ?? "degraded", res.status, body.message);
  }
  return (await res.json()) as ExtractResult;
}

export type WorkerDownloadResponse =
  | { kind: "stream"; res: Response }
  | { kind: "r2"; r2Url: string };

export async function workerDownload(
  url: string,
  formatId: string,
): Promise<WorkerDownloadResponse> {
  assertEnv();
  const res = await fetch(`${WORKER_URL}/download`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-worker-token": WORKER_TOKEN!,
    },
    body: JSON.stringify({ url, formatId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ExtractError(body.error ?? "degraded", res.status, body.message);
  }
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const body = (await res.json()) as { r2Url: string };
    return { kind: "r2", r2Url: body.r2Url };
  }
  return { kind: "stream", res };
}
