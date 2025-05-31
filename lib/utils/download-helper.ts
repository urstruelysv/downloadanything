import type { VideoFormat } from "@/types/video"

export async function downloadFile(format: VideoFormat, title: string, url?: string): Promise<void> {
  try {
    if (!url) {
      throw new Error("URL is required for download")
    }

    const platform = detectPlatformFromUrl(url)

    switch (platform) {
      case "YouTube":
        await downloadYouTubeVideo(url, format, title)
        break
      case "Instagram":
        await downloadInstagramVideo(url, format, title)
        break
      case "TikTok":
        await downloadTikTokVideo(url, format, title)
        break
      default:
        // Mock download for other platforms
        await downloadMockFile(format, title)
    }
  } catch (error) {
    console.error("Download failed:", error)
    throw error
  }
}

function detectPlatformFromUrl(url: string): string {
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "YouTube"
  if (url.includes("instagram.com")) return "Instagram"
  if (url.includes("tiktok.com")) return "TikTok"
  if (url.includes("facebook.com")) return "Facebook"
  if (url.includes("twitter.com") || url.includes("x.com")) return "Twitter"
  if (url.includes("vimeo.com")) return "Vimeo"
  return "Unknown"
}

async function downloadYouTubeVideo(url: string, format: VideoFormat, title: string): Promise<void> {
  try {
    const response = await fetch("/api/download-youtube", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        format: format.type,
        quality: format.quality,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "YouTube download failed")
    }

    await streamDownload(response, title, format)
  } catch (error) {
    console.error("YouTube download error:", error)
    throw error
  }
}

async function downloadInstagramVideo(url: string, format: VideoFormat, title: string): Promise<void> {
  try {
    const response = await fetch("/api/download-instagram", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        format: format.type,
        quality: format.quality,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Instagram download failed")
    }

    await streamDownload(response, title, format)
  } catch (error) {
    console.error("Instagram download error:", error)
    throw error
  }
}

async function downloadTikTokVideo(url: string, format: VideoFormat, title: string): Promise<void> {
  try {
    const response = await fetch("/api/download-tiktok", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        format: format.type,
        quality: format.quality,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "TikTok download failed")
    }

    await streamDownload(response, title, format)
  } catch (error) {
    console.error("TikTok download error:", error)
    throw error
  }
}

async function streamDownload(response: Response, title: string, format: VideoFormat): Promise<void> {
  const blob = await response.blob()
  const downloadUrl = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = downloadUrl

  const sanitizedTitle = title.replace(/[^a-zA-Z0-9\s]/g, "_").substring(0, 50)
  const extension = format.type === "audio" ? "mp3" : "mp4"
  link.download = `${sanitizedTitle}_${format.quality}.${extension}`

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(downloadUrl)
}

async function downloadMockFile(format: VideoFormat, title: string): Promise<void> {
  // Create mock content for unsupported platforms
  let content: string
  let mimeType: string
  let filename: string

  const sanitizedTitle = title.replace(/[^a-zA-Z0-9\s]/g, "_").substring(0, 50)

  if (format.type === "video") {
    content = createMockVideoContent(format.quality)
    mimeType = "video/mp4"
    filename = `${sanitizedTitle}_${format.quality}.${format.format.toLowerCase()}`
  } else {
    content = createMockAudioContent(format.quality)
    mimeType = "audio/mpeg"
    filename = `${sanitizedTitle}_${format.quality}.${format.format.toLowerCase()}`
  }

  const blob = new Blob([content], { type: mimeType })
  await triggerDownload(blob, filename)
}

function createMockVideoContent(quality: string): string {
  const baseContent = "MOCK_VIDEO_FILE_CONTENT_"
  const qualityMultiplier = getQualityMultiplier(quality)
  return baseContent.repeat(qualityMultiplier * 1000)
}

function createMockAudioContent(quality: string): string {
  const baseContent = "MOCK_AUDIO_FILE_CONTENT_"
  const qualityMultiplier = Math.max(1, Number.parseInt(quality) / 128) || 1
  return baseContent.repeat(qualityMultiplier * 500)
}

function getQualityMultiplier(quality: string): number {
  switch (quality.toLowerCase()) {
    case "4k":
      return 8
    case "1080p":
      return 4
    case "720p":
      return 2
    case "480p":
      return 1
    case "320kbps":
      return 2
    case "128kbps":
      return 1
    default:
      return 1
  }
}

async function triggerDownload(blob: Blob, filename: string): Promise<void> {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.style.display = "none"

  document.body.appendChild(link)
  link.click()

  setTimeout(() => {
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, 100)
}
