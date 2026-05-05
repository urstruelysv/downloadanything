import type { ContentType, Platform } from "@/lib/types";

type Detected = { platform: Platform; contentType: ContentType };

const RULES: Array<{
  platform: Platform;
  hostMatch: RegExp;
  contentRules?: Array<{ pathMatch: RegExp; contentType: ContentType }>;
  defaultContentType: ContentType;
}> = [
  {
    platform: "youtube",
    hostMatch: /(?:^|\.)((?:m\.)?youtube\.com|youtu\.be|music\.youtube\.com)$/,
    contentRules: [
      { pathMatch: /^\/playlist/, contentType: "playlist" },
      { pathMatch: /[?&]list=/, contentType: "playlist" },
      { pathMatch: /^\/(watch|shorts|embed|v|live)/, contentType: "video" },
    ],
    defaultContentType: "video",
  },
  {
    platform: "instagram",
    hostMatch: /(?:^|\.)(instagram\.com|instagr\.am)$/,
    contentRules: [
      { pathMatch: /^\/(reel|reels)\//, contentType: "video" },
      { pathMatch: /^\/(p|tv)\//, contentType: "carousel" },
      { pathMatch: /^\/stories\//, contentType: "video" },
    ],
    defaultContentType: "video",
  },
  {
    platform: "tiktok",
    hostMatch: /(?:^|\.)(tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)$/,
    defaultContentType: "video",
  },
  {
    platform: "twitter",
    hostMatch: /(?:^|\.)(twitter\.com|x\.com|t\.co|mobile\.twitter\.com)$/,
    defaultContentType: "video",
  },
  {
    platform: "facebook",
    hostMatch: /(?:^|\.)(facebook\.com|fb\.watch|fb\.com|m\.facebook\.com)$/,
    defaultContentType: "video",
  },
  {
    platform: "reddit",
    hostMatch: /(?:^|\.)(reddit\.com|redd\.it|v\.redd\.it|i\.redd\.it)$/,
    contentRules: [
      { pathMatch: /\.(jpg|jpeg|png|webp|gif)$/i, contentType: "photo" },
      { pathMatch: /\/gallery\//, contentType: "carousel" },
    ],
    defaultContentType: "video",
  },
  {
    platform: "pinterest",
    hostMatch: /(?:^|\.)(pinterest\.com|pin\.it)$/,
    defaultContentType: "photo",
  },
  {
    platform: "vimeo",
    hostMatch: /(?:^|\.)(vimeo\.com|player\.vimeo\.com)$/,
    defaultContentType: "video",
  },
  {
    platform: "soundcloud",
    hostMatch: /(?:^|\.)(soundcloud\.com|on\.soundcloud\.com)$/,
    defaultContentType: "audio",
  },
];

const IMAGE_EXT = /\.(jpg|jpeg|png|webp|gif|bmp|tiff|avif)(\?|$)/i;

export function detect(url: string): Detected | null {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;

  const host = parsed.hostname.toLowerCase();
  const pathAndQuery = parsed.pathname + parsed.search;

  for (const rule of RULES) {
    if (!rule.hostMatch.test(host)) continue;
    const matched = rule.contentRules?.find((r) => r.pathMatch.test(pathAndQuery));
    return {
      platform: rule.platform,
      contentType: matched?.contentType ?? rule.defaultContentType,
    };
  }

  if (IMAGE_EXT.test(parsed.pathname)) {
    return { platform: "generic", contentType: "photo" };
  }
  return { platform: "generic", contentType: "unknown" };
}

export function validateUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
