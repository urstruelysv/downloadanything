import { describe, it, expect, vi, beforeEach } from "vitest";
import { encodeCobaltFormat, decodeCobaltFormat } from "@/lib/extraction/cobalt";

describe("cobalt format ID encoding", () => {
  it("encodes video format", () => {
    expect(encodeCobaltFormat("auto", "1080")).toBe("cobalt:auto:1080");
    expect(encodeCobaltFormat("auto", "720")).toBe("cobalt:auto:720");
  });

  it("encodes audio format with bitrate", () => {
    expect(encodeCobaltFormat("audio", "mp3", "320")).toBe("cobalt:audio:mp3:320");
  });

  it("encodes mute mode", () => {
    expect(encodeCobaltFormat("mute", "1080")).toBe("cobalt:mute:1080");
  });
});

describe("cobalt format ID decoding", () => {
  it("returns null for non-cobalt IDs", () => {
    expect(decodeCobaltFormat("ytdlp-123")).toBeNull();
    expect(decodeCobaltFormat("direct:0")).toBeNull();
    expect(decodeCobaltFormat("")).toBeNull();
  });

  it("decodes video format", () => {
    expect(decodeCobaltFormat("cobalt:auto:1080")).toEqual({
      downloadMode: "auto",
      videoQuality: "1080",
    });
  });

  it("decodes audio format", () => {
    expect(decodeCobaltFormat("cobalt:audio:mp3:128")).toEqual({
      downloadMode: "audio",
      audioFormat: "mp3",
      audioBitrate: "128",
    });
  });

  it("decodes mute format", () => {
    expect(decodeCobaltFormat("cobalt:mute:720")).toEqual({
      downloadMode: "mute",
      videoQuality: "720",
    });
  });

  it("roundtrips encode/decode for video", () => {
    const id = encodeCobaltFormat("auto", "1080");
    const decoded = decodeCobaltFormat(id);
    expect(decoded).toEqual({ downloadMode: "auto", videoQuality: "1080" });
  });

  it("roundtrips encode/decode for audio", () => {
    const id = encodeCobaltFormat("audio", "mp3", "320");
    const decoded = decodeCobaltFormat(id);
    expect(decoded).toEqual({ downloadMode: "audio", audioFormat: "mp3", audioBitrate: "320" });
  });
});

describe("cobaltExtract", () => {
  beforeEach(() => {
    vi.stubEnv("WORKER_URL", "https://cobalt.test");
    vi.stubEnv("WORKER_TOKEN", "test-token");
  });

  it("maps tunnel response to ExtractResult", async () => {
    const mockResponse = {
      status: "tunnel",
      url: "https://cobalt.test/tunnel/abc",
      filename: "Rick_Astley_Never_Gonna_Give_You_Up_720p.mp4",
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }));

    const { cobaltExtract } = await import("@/lib/extraction/cobalt");
    const result = await cobaltExtract("https://youtube.com/watch?v=dQw4w9WgXcQ", "youtube", "video");

    expect(result.platform).toBe("youtube");
    expect(result.contentType).toBe("video");
    expect(result.title).toBe("Rick Astley Never Gonna Give You Up");
    expect(result.items).toHaveLength(1);
    expect(result.items[0].formats.length).toBeGreaterThan(0);
    expect(result.items[0].formats[0].formatId).toMatch(/^cobalt:/);

    vi.unstubAllGlobals();
  });

  it("maps redirect response to ExtractResult", async () => {
    const mockResponse = {
      status: "redirect",
      url: "https://v.redd.it/abc/DASH_720.mp4",
      filename: "funny_cat_video.mp4",
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }));

    const { cobaltExtract } = await import("@/lib/extraction/cobalt");
    const result = await cobaltExtract("https://reddit.com/r/cats/abc", "reddit", "video");

    expect(result.platform).toBe("reddit");
    expect(result.contentType).toBe("video");
    expect(result.title).toBe("funny cat video");

    vi.unstubAllGlobals();
  });

  it("maps picker response to carousel ExtractResult", async () => {
    const mockResponse = {
      status: "picker",
      picker: [
        { type: "photo", url: "https://cdn.ig/photo1.jpg", thumb: "https://cdn.ig/thumb1.jpg" },
        { type: "photo", url: "https://cdn.ig/photo2.jpg" },
      ],
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }));

    const { cobaltExtract } = await import("@/lib/extraction/cobalt");
    const result = await cobaltExtract("https://instagram.com/p/abc", "instagram", "carousel");

    expect(result.platform).toBe("instagram");
    expect(result.contentType).toBe("carousel");
    expect(result.thumbnail).toBe("https://cdn.ig/thumb1.jpg");
    expect(result.items).toHaveLength(2);
    expect(result.items[0].formats[0].directUrl).toBe("https://cdn.ig/photo1.jpg");

    vi.unstubAllGlobals();
  });

  it("maps audio content to audio formats", async () => {
    const mockResponse = {
      status: "tunnel",
      url: "https://cobalt.test/tunnel/xyz",
      filename: "artist_track.mp3",
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }));

    const { cobaltExtract } = await import("@/lib/extraction/cobalt");
    const result = await cobaltExtract("https://soundcloud.com/artist/track", "soundcloud", "audio");

    expect(result.contentType).toBe("audio");
    expect(result.items[0].type).toBe("audio");
    expect(result.items[0].formats[0].ext).toBe("mp3");

    vi.unstubAllGlobals();
  });

  it("throws ExtractError on cobalt error response", async () => {
    const mockResponse = {
      status: "error",
      error: { code: "error.api.content.video.unavailable" },
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    }));

    const { cobaltExtract } = await import("@/lib/extraction/cobalt");
    const { ExtractError } = await import("@/lib/extraction/errors");
    await expect(
      cobaltExtract("https://youtube.com/watch?v=deleted", "youtube", "video"),
    ).rejects.toThrow(ExtractError);

    vi.unstubAllGlobals();
  });
});
