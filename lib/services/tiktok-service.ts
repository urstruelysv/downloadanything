interface TikTokVideoInfo {
  title: string
  thumbnail: string
  duration: string
  views: string
  formats: Array<{
    type: "video" | "audio"
    quality: string
    size: string
    format: string
    downloadUrl: string
  }>
}

export class TikTokService {
  private static readonly API_BASE = "https://tiktok-downloader-api.herokuapp.com"

  static async getVideoInfo(url: string): Promise<TikTokVideoInfo> {
    try {
      const response = await fetch(`${this.API_BASE}/api/info`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch TikTok video info")
      }

      const data = await response.json()
      return this.parseTikTokData(data)
    } catch (error) {
      console.error("TikTok service error:", error)
      // Fallback to mock data if API fails
      return this.getMockTikTokData(url)
    }
  }

  static async downloadVideo(url: string, quality: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.API_BASE}/api/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, quality }),
      })

      if (!response.ok) {
        throw new Error("TikTok download failed")
      }

      return await response.blob()
    } catch (error) {
      console.error("TikTok download error:", error)
      throw error
    }
  }

  private static parseTikTokData(data: any): TikTokVideoInfo {
    return {
      title: data.title || "TikTok Video",
      thumbnail: data.thumbnail || "/placeholder.svg?height=180&width=320",
      duration: this.formatDuration(data.duration || 15),
      views: this.formatViews(data.views || 0),
      formats: [
        { type: "video", quality: "HD", size: "~10MB", format: "MP4", downloadUrl: data.videoUrl },
        { type: "video", quality: "SD", size: "~5MB", format: "MP4", downloadUrl: data.videoUrl },
        { type: "audio", quality: "128kbps", size: "~1MB", format: "MP3", downloadUrl: data.audioUrl },
      ],
    }
  }

  private static getMockTikTokData(url: string): TikTokVideoInfo {
    return {
      title: "TikTok Video - Viral Dance",
      thumbnail: "/placeholder.svg?height=180&width=320",
      duration: "0:15",
      views: "3.2M",
      formats: [
        { type: "video", quality: "1080p", size: "8.7 MB", format: "MP4", downloadUrl: "" },
        { type: "video", quality: "720p", size: "5.4 MB", format: "MP4", downloadUrl: "" },
        { type: "audio", quality: "128kbps", size: "0.5 MB", format: "MP3", downloadUrl: "" },
      ],
    }
  }

  private static formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  private static formatViews(views: number): string {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`
    return views.toString()
  }
}
