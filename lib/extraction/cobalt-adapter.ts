import { ExtractError } from "@/shared/errors";
import type { Platform, ContentType, ExtractResult } from "@/shared/types";
import type { ExtractionAdapter } from "./adapter";
import type { DownloadResult } from "./index";
import { cobaltExtract, cobaltDownload, decodeCobaltFormat } from "./cobalt";

export const cobaltAdapter: ExtractionAdapter = {
  ownsFormat(formatId: string): boolean {
    return decodeCobaltFormat(formatId) !== null;
  },

  extract(url: string, platform: Platform, contentType: ContentType): Promise<ExtractResult> {
    return cobaltExtract(url, platform, contentType);
  },

  async download(url: string, formatId: string): Promise<DownloadResult> {
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
  },
};
