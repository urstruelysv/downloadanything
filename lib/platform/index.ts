export type { Platform, ContentType } from "@/shared/types";
import type { Platform, ContentType } from "@/shared/types";

export type PlatformMeta = {
  label: string;
  color: string;
  hostMatch: RegExp;
  contentRules?: Array<{ pathMatch: RegExp; contentType: ContentType }>;
  defaultContentType: ContentType;
};

const PLATFORM_REGISTRY: Record<Exclude<Platform, "generic">, PlatformMeta> = {
  youtube: {
    label: "YouTube",
    color: "#FF0000",
    hostMatch: /(?:^|\.)((?:m\.)?youtube\.com|youtu\.be|music\.youtube\.com)$/,
    contentRules: [
      { pathMatch: /^\/playlist/, contentType: "playlist" },
      { pathMatch: /[?&]list=/, contentType: "playlist" },
      { pathMatch: /^\/(watch|shorts|embed|v|live)/, contentType: "video" },
    ],
    defaultContentType: "video",
  },
  instagram: {
    label: "Instagram",
    color: "#E1306C",
    hostMatch: /(?:^|\.)(instagram\.com|instagr\.am)$/,
    contentRules: [
      { pathMatch: /^\/(reel|reels)\//, contentType: "video" },
      { pathMatch: /^\/(p|tv)\//, contentType: "carousel" },
      { pathMatch: /^\/stories\//, contentType: "video" },
    ],
    defaultContentType: "video",
  },
  tiktok: {
    label: "TikTok",
    color: "#000000",
    hostMatch: /(?:^|\.)(tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)$/,
    defaultContentType: "video",
  },
  twitter: {
    label: "Twitter / X",
    color: "#1DA1F2",
    hostMatch: /(?:^|\.)(twitter\.com|x\.com|t\.co|mobile\.twitter\.com)$/,
    defaultContentType: "video",
  },
  facebook: {
    label: "Facebook",
    color: "#1877F2",
    hostMatch: /(?:^|\.)(facebook\.com|fb\.watch|fb\.com|m\.facebook\.com)$/,
    defaultContentType: "video",
  },
  reddit: {
    label: "Reddit",
    color: "#FF4500",
    hostMatch: /(?:^|\.)(reddit\.com|redd\.it|v\.redd\.it|i\.redd\.it)$/,
    contentRules: [
      { pathMatch: /\.(jpg|jpeg|png|webp|gif)$/i, contentType: "photo" },
      { pathMatch: /\/gallery\//, contentType: "carousel" },
    ],
    defaultContentType: "video",
  },
  pinterest: {
    label: "Pinterest",
    color: "#E60023",
    hostMatch: /(?:^|\.)(pinterest\.com|pin\.it)$/,
    defaultContentType: "photo",
  },
  vimeo: {
    label: "Vimeo",
    color: "#1AB7EA",
    hostMatch: /(?:^|\.)(vimeo\.com|player\.vimeo\.com)$/,
    defaultContentType: "video",
  },
  soundcloud: {
    label: "SoundCloud",
    color: "#FF5500",
    hostMatch: /(?:^|\.)(soundcloud\.com|on\.soundcloud\.com)$/,
    defaultContentType: "audio",
  },
};

const IMAGE_EXT = /\.(jpg|jpeg|png|webp|gif|bmp|tiff|avif)(\?|$)/i;
const PRIVATE_HOSTS =
  /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|169\.254\.|0\.0\.0\.0|::1)/i;

export type DetectResult = { platform: Platform; contentType: ContentType };

export function detect(url: string): DetectResult | null {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

  const host = parsed.hostname.toLowerCase();
  const pathAndQuery = parsed.pathname + parsed.search;

  for (const [platform, meta] of Object.entries(PLATFORM_REGISTRY)) {
    if (!meta.hostMatch.test(host)) continue;
    const matched = meta.contentRules?.find((r) =>
      r.pathMatch.test(pathAndQuery),
    );
    return {
      platform: platform as Platform,
      contentType: matched?.contentType ?? meta.defaultContentType,
    };
  }

  if (IMAGE_EXT.test(parsed.pathname)) {
    return { platform: "generic", contentType: "photo" };
  }
  return { platform: "generic", contentType: "unknown" };
}

export function validateUrl(
  rawUrl: string,
): { ok: true; url: string } | { ok: false; reason: string } {
  let u: URL;
  try {
    u = new URL(rawUrl.trim());
  } catch {
    return { ok: false, reason: "invalid_url" };
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    return { ok: false, reason: "invalid_url" };
  }
  if (PRIVATE_HOSTS.test(u.hostname)) {
    return { ok: false, reason: "invalid_url" };
  }
  return { ok: true, url: u.href };
}

export function supportedPlatforms(): Platform[] {
  return Object.keys(PLATFORM_REGISTRY) as Platform[];
}

export function platformMeta(
  p: Exclude<Platform, "generic">,
): PlatformMeta | undefined {
  return PLATFORM_REGISTRY[p];
}
