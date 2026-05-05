import type { ExtractResult } from "@/lib/types";
import { detect } from "@/lib/platform/detector";
import { workerExtract } from "@/lib/extract/worker-client";

export async function extract(url: string): Promise<ExtractResult> {
  const det = detect(url);
  if (!det) throw new ExtractError("unsupported_platform", 400);
  return retry(() => workerExtract(url), 2);
}

export class ExtractError extends Error {
  constructor(public code: string, public httpStatus: number, msg?: string) {
    super(msg ?? code);
  }
}

async function retry<T>(fn: () => Promise<T>, attempts: number): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i <= attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (e instanceof ExtractError && e.httpStatus < 500) throw e;
      if (i < attempts) await new Promise((r) => setTimeout(r, 1000 * Math.pow(3, i)));
    }
  }
  throw lastErr;
}
