interface YouTubeVideoInfo {
  title: string
  thumbnail: string
  duration: string
  views: string
  formats: Array<{
    itag: number
    url: string
    mimeType: string
    quality: string
    qualityLabel?: string
    audioBitrate?: number
    hasVideo: boolean
    hasAudio: boolean
    container: string
    codecs: string
    filesize?: number
  }>
}

export class YouTubeService {
  private static readonly API_BASE = "https://youtube-dl-web-api.herokuapp.com"

  static async getVideoInfo(url: string): Promise<YouTubeVideoInfo> {
    try {
      // Extract video ID from URL
      const videoId = this.extractVideoId(url)
      if (!videoId) {
        throw new Error("Invalid YouTube URL")
      }

      // Use youtube-dl-web API or similar service
      const response = await fetch(`${this.API_BASE}/api/info`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url,
          format: "json",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch video info")
      }

      const data = await response.json()
      return this.parseVideoInfo(data)
    } catch (error) {
      console.error("YouTube service error:", error)
      throw error
    }
  }

  static async downloadVideo(url: string, format: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.API_BASE}/api/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: url,
          format: format,
        }),
      })

      if (!response.ok) {
        throw new Error("Download failed")
      }

      return await response.blob()
    } catch (error) {
      console.error("Download error:", error)
      throw error
    }
  }

  private static extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        return match[1]
      }
    }

    return null
  }

  private static parseVideoInfo(data: any): YouTubeVideoInfo {
    return {
      title: data.title || "Unknown Title",
      thumbnail: data.thumbnail || "/placeholder.svg?height=180&width=320",
      duration: this.formatDuration(data.duration),
      views: this.formatViews(data.view_count),
      formats: this.parseFormats(data.formats || []),
    }
  }

  private static parseFormats(formats: any[]): YouTubeVideoInfo["formats"] {
    return formats.map((format) => ({
      itag: format.format_id,
      url: format.url,
      mimeType: format.ext === "mp4" ? "video/mp4" : format.ext === "webm" ? "video/webm" : "audio/mp4",
      quality: format.format_note || format.quality || "unknown",
      qualityLabel: format.height ? `${format.height}p` : undefined,
      audioBitrate: format.abr,
      hasVideo: format.vcodec !== "none",
      hasAudio: format.acodec !== "none",
      container: format.ext,
      codecs: format.vcodec && format.acodec ? `${format.vcodec}, ${format.acodec}` : format.vcodec || format.acodec,
      filesize: format.filesize,
    }))
  }

  private static formatDuration(seconds: number): string {
    if (!seconds) return "0:00"
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  private static formatViews(views: number): string {
    if (!views) return "0"
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`
    }
    return views.toString()
  }
}
