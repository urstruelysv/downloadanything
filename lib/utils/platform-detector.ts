import type { Platform } from "@/types/video"

export function detectPlatform(url: string): Platform {
  const cleanUrl = url.toLowerCase().trim()

  // YouTube
  if (cleanUrl.includes("youtube.com") || cleanUrl.includes("youtu.be") || cleanUrl.includes("m.youtube.com")) {
    return "YouTube"
  }

  // Instagram
  if (cleanUrl.includes("instagram.com") || cleanUrl.includes("instagr.am")) {
    return "Instagram"
  }

  // Facebook
  if (
    cleanUrl.includes("facebook.com") ||
    cleanUrl.includes("fb.watch") ||
    cleanUrl.includes("fb.com") ||
    cleanUrl.includes("m.facebook.com")
  ) {
    return "Facebook"
  }

  // Twitter/X
  if (cleanUrl.includes("twitter.com") || cleanUrl.includes("x.com") || cleanUrl.includes("t.co")) {
    return "Twitter"
  }

  // TikTok
  if (cleanUrl.includes("tiktok.com") || cleanUrl.includes("vm.tiktok.com")) {
    return "TikTok"
  }

  // Vimeo
  if (cleanUrl.includes("vimeo.com")) {
    return "Vimeo"
  }

  return "Unknown"
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    // Check if it's a partial URL that might work
    if (
      url.includes(".") &&
      (url.includes("youtube") ||
        url.includes("instagram") ||
        url.includes("facebook") ||
        url.includes("twitter") ||
        url.includes("tiktok"))
    ) {
      return true
    }
    return false
  }
}
