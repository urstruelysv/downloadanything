import { detect } from "@/lib/platform";
import { ExtractError } from "./errors";
import { cobaltExtract, cobaltDownload, decodeCobaltFormat } from "./cobalt";
import type { ExtractResult } from "./types";

export { ExtractError } from "./errors";
export type { ExtractResult, Format, ExtractItem, Delivery } from "./types";

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

  return retry(async () => {
    return cobaltExtract(url, det.platform, det.contentType);
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

  if (decodeCobaltFormat(formatId)) {
    const { downloadUrl, filename } = await cobaltDownload(url, formatId);
    const res = await fetch(downloadUrl);
    if (!res.ok) {
      throw new ExtractError("degraded", 502, `Download source returned ${res.status}`);
    }
    const headers = new Headers();
    const ct = res.headers.get("content-type");
    if (ct) headers.set("content-type", ct);
    const cl = res.headers.get("content-length");
    if (cl) headers.set("content-length", cl);
    const ecl = res.headers.get("estimated-content-length");
    if (!cl && ecl) headers.set("content-length", ecl);
    headers.set("content-disposition", `attachment; filename="${filename}"`);
    return { kind: "stream", body: res.body!, headers };
  }

  throw new ExtractError("internal", 400, `Unknown format: ${formatId}`);
}
