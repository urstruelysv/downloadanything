import { describe, it, expect } from "vitest";
import type { ExtractionAdapter } from "@/lib/extraction/adapter";
import { createAdapterRegistry } from "@/lib/extraction/adapter";
import type { ExtractResult } from "@/shared/types";

const fakeResult: ExtractResult = {
  platform: "youtube",
  contentType: "video",
  title: "Test",
  items: [{ id: "0", type: "video", formats: [] }],
};

function makeFakeAdapter(prefix: string): ExtractionAdapter {
  return {
    ownsFormat: (id: string) => id.startsWith(`${prefix}:`),
    extract: async () => fakeResult,
    download: async () => ({
      kind: "stream" as const,
      body: new ReadableStream(),
      headers: new Headers(),
    }),
  };
}

describe("adapter registry", () => {
  it("dispatches to the adapter that owns the format ID", () => {
    const cobaltAdapter = makeFakeAdapter("cobalt");
    const ytdlpAdapter = makeFakeAdapter("ytdlp");
    const registry = createAdapterRegistry([cobaltAdapter, ytdlpAdapter]);

    expect(registry.findAdapter("cobalt:auto:1080")).toBe(cobaltAdapter);
    expect(registry.findAdapter("ytdlp:best")).toBe(ytdlpAdapter);
  });

  it("returns null for unrecognized format IDs", () => {
    const registry = createAdapterRegistry([makeFakeAdapter("cobalt")]);
    expect(registry.findAdapter("unknown:foo")).toBeNull();
  });

  it("works with a single adapter", () => {
    const adapter = makeFakeAdapter("cobalt");
    const registry = createAdapterRegistry([adapter]);
    expect(registry.findAdapter("cobalt:audio:mp3:320")).toBe(adapter);
  });
});
