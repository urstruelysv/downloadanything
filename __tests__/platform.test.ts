import { describe, it, expect } from "vitest";
import { detect, validateUrl, supportedPlatforms } from "@/lib/platform";

describe("detect", () => {
  it("detects YouTube video URLs", () => {
    expect(detect("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
      platform: "youtube",
      contentType: "video",
    });
    expect(detect("https://youtu.be/dQw4w9WgXcQ")).toEqual({
      platform: "youtube",
      contentType: "video",
    });
    expect(detect("https://m.youtube.com/watch?v=abc")).toEqual({
      platform: "youtube",
      contentType: "video",
    });
  });

  it("detects YouTube shorts", () => {
    expect(detect("https://www.youtube.com/shorts/abc123")).toEqual({
      platform: "youtube",
      contentType: "video",
    });
  });

  it("detects YouTube playlists", () => {
    expect(detect("https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf")).toEqual({
      platform: "youtube",
      contentType: "playlist",
    });
    expect(detect("https://www.youtube.com/watch?v=x&list=PLabc")).toEqual({
      platform: "youtube",
      contentType: "playlist",
    });
  });

  it("detects Instagram URLs", () => {
    expect(detect("https://www.instagram.com/reel/abc123/")).toEqual({
      platform: "instagram",
      contentType: "video",
    });
    expect(detect("https://www.instagram.com/p/abc123/")).toEqual({
      platform: "instagram",
      contentType: "carousel",
    });
    expect(detect("https://www.instagram.com/stories/user/123/")).toEqual({
      platform: "instagram",
      contentType: "video",
    });
  });

  it("detects TikTok URLs", () => {
    expect(detect("https://www.tiktok.com/@user/video/123")).toEqual({
      platform: "tiktok",
      contentType: "video",
    });
    expect(detect("https://vm.tiktok.com/abc/")).toEqual({
      platform: "tiktok",
      contentType: "video",
    });
  });

  it("detects Twitter/X URLs", () => {
    expect(detect("https://twitter.com/user/status/123")).toEqual({
      platform: "twitter",
      contentType: "video",
    });
    expect(detect("https://x.com/user/status/123")).toEqual({
      platform: "twitter",
      contentType: "video",
    });
  });

  it("detects Facebook URLs", () => {
    expect(detect("https://www.facebook.com/video/123")).toEqual({
      platform: "facebook",
      contentType: "video",
    });
    expect(detect("https://fb.watch/abc")).toEqual({
      platform: "facebook",
      contentType: "video",
    });
  });

  it("detects Reddit URLs", () => {
    expect(detect("https://www.reddit.com/r/sub/comments/abc")).toEqual({
      platform: "reddit",
      contentType: "video",
    });
    expect(detect("https://i.redd.it/photo.jpg")).toEqual({
      platform: "reddit",
      contentType: "photo",
    });
    expect(detect("https://www.reddit.com/gallery/abc")).toEqual({
      platform: "reddit",
      contentType: "carousel",
    });
  });

  it("detects Pinterest URLs", () => {
    expect(detect("https://www.pinterest.com/pin/123/")).toEqual({
      platform: "pinterest",
      contentType: "photo",
    });
  });

  it("detects Vimeo URLs", () => {
    expect(detect("https://vimeo.com/123456")).toEqual({
      platform: "vimeo",
      contentType: "video",
    });
  });

  it("detects SoundCloud URLs", () => {
    expect(detect("https://soundcloud.com/artist/track")).toEqual({
      platform: "soundcloud",
      contentType: "audio",
    });
  });

  it("detects generic image URLs", () => {
    expect(detect("https://example.com/photo.jpg")).toEqual({
      platform: "generic",
      contentType: "photo",
    });
    expect(detect("https://example.com/photo.png?w=400")).toEqual({
      platform: "generic",
      contentType: "photo",
    });
  });

  it("returns generic/unknown for unknown URLs", () => {
    expect(detect("https://example.com/page")).toEqual({
      platform: "generic",
      contentType: "unknown",
    });
  });

  it("returns null for invalid URLs", () => {
    expect(detect("not a url")).toBeNull();
    expect(detect("ftp://example.com/file")).toBeNull();
  });
});

describe("validateUrl", () => {
  it("accepts valid http/https URLs", () => {
    expect(validateUrl("https://youtube.com/watch?v=abc")).toEqual({
      ok: true,
      url: "https://youtube.com/watch?v=abc",
    });
  });

  it("rejects non-http protocols", () => {
    expect(validateUrl("ftp://example.com")).toEqual({
      ok: false,
      reason: "invalid_url",
    });
  });

  it("rejects private hosts", () => {
    expect(validateUrl("http://localhost/test")).toEqual({
      ok: false,
      reason: "invalid_url",
    });
    expect(validateUrl("http://127.0.0.1/test")).toEqual({
      ok: false,
      reason: "invalid_url",
    });
    expect(validateUrl("http://192.168.1.1/test")).toEqual({
      ok: false,
      reason: "invalid_url",
    });
    expect(validateUrl("http://10.0.0.1/test")).toEqual({
      ok: false,
      reason: "invalid_url",
    });
  });

  it("rejects garbage input", () => {
    expect(validateUrl("not a url")).toEqual({
      ok: false,
      reason: "invalid_url",
    });
  });

  it("trims whitespace", () => {
    const result = validateUrl("  https://youtube.com  ");
    expect(result.ok).toBe(true);
  });
});

describe("supportedPlatforms", () => {
  it("returns all platforms except generic", () => {
    const platforms = supportedPlatforms();
    expect(platforms).toContain("youtube");
    expect(platforms).toContain("instagram");
    expect(platforms).toContain("tiktok");
    expect(platforms).toContain("twitter");
    expect(platforms).not.toContain("generic");
    expect(platforms.length).toBe(9);
  });
});
