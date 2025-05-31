// Simplified implementation that works without external APIs
interface VideoInfo {
  title: string
  thumbnail: string
  duration: string
  views: string
  platform: string
  formats: VideoFormat[]
}

interface VideoFormat {
  type: "video" | "audio"
  quality: string
  size: string
  format: string
}

export class YTDLService {
  static async getVideoInfo(videoId: string): Promise<VideoInfo> {
    try {
      // Try to get basic info from YouTube's oEmbed API (no key required)
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`

      const response = await fetch(oembedUrl)

      if (response.ok) {
        const data = await response.json()
        return {
          title: data.title || "YouTube Video",
          thumbnail: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          duration: "Unknown", // oEmbed doesn't provide duration
          views: "Unknown", // oEmbed doesn't provide view count
          platform: "YouTube",
          formats: this.getStandardYouTubeFormats(),
        }
      } else {
        // Fallback to mock data with video ID
        return this.getFallbackVideoInfo(videoId)
      }
    } catch (error) {
      console.error("YouTube oEmbed failed, using fallback:", error)
      return this.getFallbackVideoInfo(videoId)
    }
  }

  private static getStandardYouTubeFormats(): VideoFormat[] {
    return [
      { type: "video", quality: "1080p", size: "~100MB", format: "MP4" },
      { type: "video", quality: "720p", size: "~50MB", format: "MP4" },
      { type: "video", quality: "480p", size: "~25MB", format: "MP4" },
      { type: "video", quality: "360p", size: "~15MB", format: "MP4" },
      { type: "audio", quality: "128kbps", size: "~5MB", format: "MP3" },
      { type: "audio", quality: "320kbps", size: "~12MB", format: "MP3" },
    ]
  }

  private static getFallbackVideoInfo(videoId: string): VideoInfo {
    return {
      title: "YouTube Video",
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      duration: "Unknown",
      views: "Unknown",
      platform: "YouTube",
      formats: this.getStandardYouTubeFormats(),
    }
  }
}
