import { detect } from "@/lib/platform/detector";

const PRIVATE_HOSTS = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|169\.254\.|0\.0\.0\.0|::1)/i;

export function assertSafeExtractTarget(rawUrl: string): { ok: true } | { ok: false; reason: string } {
  let u: URL;
  try {
    u = new URL(rawUrl.trim());
  } catch {
    return { ok: false, reason: "invalid_url" };
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    return { ok: false, reason: "invalid_protocol" };
  }
  if (PRIVATE_HOSTS.test(u.hostname)) {
    return { ok: false, reason: "private_host" };
  }
  const det = detect(rawUrl);
  if (!det) return { ok: false, reason: "unsupported_platform" };
  return { ok: true };
}
