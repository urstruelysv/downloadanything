export const PLATFORM_LABEL: Record<string, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  tiktok: "TikTok",
  twitter: "Twitter",
  facebook: "Facebook",
  reddit: "Reddit",
  pinterest: "Pinterest",
  vimeo: "Vimeo",
  soundcloud: "SoundCloud",
  generic: "Source",
};

export const PLATFORM_COLOR: Record<string, string> = {
  youtube: "linear-gradient(135deg,#ff4d4d,#7a0000)",
  instagram: "linear-gradient(135deg,#feda75,#d62976,#4f5bd5)",
  tiktok: "linear-gradient(135deg,#25f4ee,#000,#fe2c55)",
  twitter: "linear-gradient(135deg,#000,#222)",
  facebook: "linear-gradient(135deg,#1877f2,#0a3d91)",
  reddit: "linear-gradient(135deg,#ff4500,#a02b00)",
  pinterest: "linear-gradient(135deg,#e60023,#7a0012)",
  vimeo: "linear-gradient(135deg,#1ab7ea,#005670)",
  soundcloud: "linear-gradient(135deg,#ff7a00,#ff3300)",
  generic: "linear-gradient(135deg,#666,#222)",
};

export function fmtDuration(s?: number): string {
  if (!s || s <= 0) return "—";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function fmtBytes(b?: number): string {
  if (!b) return "";
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function labelForError(code: string): string {
  switch (code) {
    case "invalid_url":
      return "That URL doesn't look right.";
    case "unsupported_platform":
      return "We don't support this platform yet.";
    case "unavailable":
      return "Source is private or removed.";
    case "quota_exceeded":
      return "Daily limit reached. Subscribe for unlimited downloads.";
    case "rate_limited":
      return "Too many requests. Slow down for a moment.";
    case "auth_required":
      return "Sign in required.";
    case "degraded":
      return "Extraction service is degraded. Try again in a minute.";
    case "network":
      return "Network error.";
    default:
      return "Something went wrong.";
  }
}
