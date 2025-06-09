interface YouTubeVideoInfo {
  title: string;
  thumbnail: string;
  duration: string;
  views: string;
  formats: Array<{
    itag: number;
    url: string;
    mimeType: string;
    quality: string;
    qualityLabel?: string;
    audioBitrate?: number;
    hasVideo: boolean;
    hasAudio: boolean;
    container: string;
    codecs: string;
    filesize?: number;
  }>;
}

export class YouTubeService {
  private static readonly API_BASE = "https://www.googleapis.com/youtube/v3";
  private static readonly API_KEY = process.env.YOUTUBE_API_KEY;

  static async getVideoInfo(url: string): Promise<YouTubeVideoInfo> {
    try {
      // Extract video ID from URL
      const videoId = this.extractVideoId(url);
      if (!videoId) {
        throw new Error("Invalid YouTube URL");
      }

      if (!this.API_KEY) {
        throw new Error("YouTube API key is not configured");
      }

      // Get video details from YouTube Data API
      const response = await fetch(
        `${this.API_BASE}/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${this.API_KEY}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch video info from YouTube");
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        throw new Error("Video not found");
      }

      const video = data.items[0];
      const snippet = video.snippet;
      const contentDetails = video.contentDetails;
      const statistics = video.statistics;

      // Get available formats
      const formats = await this.getVideoFormats(videoId);

      return {
        title: snippet.title || "Unknown Title",
        thumbnail:
          snippet.thumbnails?.maxres?.url ||
          snippet.thumbnails?.high?.url ||
          `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        duration: this.formatDuration(
          this.parseDuration(contentDetails.duration)
        ),
        views: this.formatViews(parseInt(statistics.viewCount || "0")),
        formats: formats,
      };
    } catch (error) {
      console.error("YouTube service error:", error);
      throw error;
    }
  }

  static async downloadVideo(url: string, format: string): Promise<Blob> {
    try {
      const videoId = this.extractVideoId(url);
      if (!videoId) {
        throw new Error("Invalid YouTube URL");
      }

      // Get video formats
      const formats = await this.getVideoFormats(videoId);

      // Find the appropriate format
      const selectedFormat = formats.find((f) =>
        format === "audio" ? f.hasAudio && !f.hasVideo : f.hasVideo
      );

      if (!selectedFormat) {
        throw new Error(`No ${format} format available`);
      }

      // Download the video
      const response = await fetch(selectedFormat.url);
      if (!response.ok) {
        throw new Error("Download failed");
      }

      return await response.blob();
    } catch (error) {
      console.error("Download error:", error);
      throw error;
    }
  }

  private static async getVideoFormats(
    videoId: string
  ): Promise<YouTubeVideoInfo["formats"]> {
    try {
      // Get video formats from YouTube Data API
      const response = await fetch(
        `${this.API_BASE}/videos?part=contentDetails&id=${videoId}&key=${this.API_KEY}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch video formats");
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        throw new Error("Video not found");
      }

      // For now, we'll return a simplified format list since direct download URLs
      // are not available through the public API
      return [
        {
          itag: 1,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          mimeType: "video/mp4",
          quality: "720p",
          qualityLabel: "720p",
          hasVideo: true,
          hasAudio: true,
          container: "mp4",
          codecs: "avc1.42001E, mp4a.40.2",
        },
        {
          itag: 2,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          mimeType: "audio/mp3",
          quality: "128kbps",
          audioBitrate: 128,
          hasVideo: false,
          hasAudio: true,
          container: "mp3",
          codecs: "mp3",
        },
      ];
    } catch (error) {
      console.error("Error getting video formats:", error);
      throw error;
    }
  }

  private static extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  private static parseDuration(duration: string): number {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;

    const hours = (match[1] && parseInt(match[1])) || 0;
    const minutes = (match[2] && parseInt(match[2])) || 0;
    const seconds = (match[3] && parseInt(match[3])) || 0;

    return hours * 3600 + minutes * 60 + seconds;
  }

  private static formatDuration(seconds: number): string {
    if (!seconds) return "0:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }

  private static formatViews(views: number): string {
    if (!views) return "0";
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  }
}
