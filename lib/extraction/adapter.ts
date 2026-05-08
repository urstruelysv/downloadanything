import type { Platform, ContentType, ExtractResult } from "@/shared/types";
import type { DownloadResult } from "./index";

export type ExtractionAdapter = {
  ownsFormat: (formatId: string) => boolean;
  extract: (url: string, platform: Platform, contentType: ContentType) => Promise<ExtractResult>;
  download: (url: string, formatId: string) => Promise<DownloadResult>;
};

export type AdapterRegistry = {
  findAdapter: (formatId: string) => ExtractionAdapter | null;
  adapters: ExtractionAdapter[];
};

export function createAdapterRegistry(adapters: ExtractionAdapter[]): AdapterRegistry {
  return {
    adapters,
    findAdapter(formatId: string) {
      return adapters.find((a) => a.ownsFormat(formatId)) ?? null;
    },
  };
}
