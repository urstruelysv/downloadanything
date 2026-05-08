import { detect } from "@/lib/platform";
import { ExtractError } from "@/shared/errors";
import type { ExtractResult } from "@/shared/types";
import { createAdapterRegistry } from "./adapter";
import { cobaltAdapter } from "./cobalt-adapter";

export { ExtractError } from "@/shared/errors";
export type { ExtractResult, Format, ExtractItem, Delivery } from "@/shared/types";

const registry = createAdapterRegistry([cobaltAdapter]);

const MAX_RETRIES = 2;

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

  const adapter = registry.adapters[0];
  return retry(async () => {
    return adapter.extract(url, det.platform, det.contentType);
  });
}

export type DownloadResult =
  | { kind: "stream"; body: ReadableStream; headers: Headers }
  | { kind: "r2"; r2Url: string };

export async function download(
  url: string,
  formatId: string,
  directUrl?: string,
  directHeaders?: Record<string, string>,
  title?: string,
  ext?: string,
): Promise<DownloadResult> {
  if (directUrl) {
    const res = await fetch(directUrl, {
      headers: directHeaders ?? {},
    });
    if (!res.ok) {
      throw new ExtractError("degraded", 502, `Source returned ${res.status}`);
    }
    const headers = new Headers();
    const ct = res.headers.get("content-type");
    if (ct) headers.set("content-type", ct);
    const cl = res.headers.get("content-length");
    if (cl) headers.set("content-length", cl);
    return { kind: "stream", body: res.body!, headers };
  }

  const adapter = registry.findAdapter(formatId);
  if (adapter) {
    return adapter.download(url, formatId);
  }

  throw new ExtractError("internal", 400, `Unknown format: ${formatId}`);
}
