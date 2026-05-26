import type { Platform, ContentType, ExtractResult } from "@/shared/types";
import type { DownloadResult } from "./index";

export type AdapterCapability = {
  platform: Platform;
  contentType: ContentType;
};

export type ExtractionAdapter = {
  canHandle: (cap: AdapterCapability) => boolean;
  extract: (url: string, platform: Platform, contentType: ContentType) => Promise<ExtractResult>;
  download: (url: string, formatId: string) => Promise<DownloadResult>;
};

export type AdapterRegistry = {
  findAdapter: (cap: AdapterCapability) => ExtractionAdapter | null;
  adapters: ExtractionAdapter[];
};

export function createAdapterRegistry(adapters: ExtractionAdapter[]): AdapterRegistry {
  return {
    adapters,
    findAdapter(cap: AdapterCapability) {
      return adapters.find((a) => a.canHandle(cap)) ?? null;
    },
  };
}
