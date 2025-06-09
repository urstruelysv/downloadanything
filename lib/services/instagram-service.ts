import { spawn } from "child_process";
import type { VideoData, VideoFormat } from "@/types/video";

interface YtDlpFormat {
  vcodec: string;
  acodec: string;
  height: number;
  filesize: number;
}

export class InstagramService {
  static async getVideoInfo(url: string): Promise<VideoData> {
    try {
      // Use yt-dlp to get video info
      const info = await this.getYtDlpInfo(url);
      return this.parseInstagramData(info);
    } catch (error) {
      console.error("Instagram service error:", error);
      throw error;
    }
  }

  private static async getYtDlpInfo(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const process = spawn("yt-dlp", [
        "--dump-json",
        "--no-warnings",
        "--no-playlist",
        url,
      ]);

      let stdout = "";
      let stderr = "";

      process.stdout?.on("data", (data: Buffer) => {
        stdout += data.toString();
      });

      process.stderr?.on("data", (data: Buffer) => {
        stderr += data.toString();
      });

      process.on("close", (code: number) => {
        if (code !== 0) {
          reject(new Error(`Failed to get video info: ${stderr}`));
          return;
        }

        try {
          const info = JSON.parse(stdout);
          resolve(info);
        } catch (error) {
          reject(new Error("Failed to parse video info"));
        }
      });

      process.on("error", (error: Error) => {
        reject(new Error(`Failed to start yt-dlp: ${error.message}`));
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        process.kill();
        reject(new Error("Video info fetch timeout"));
      }, 30000);
    });
  }

  private static parseInstagramData(data: any): VideoData {
    const title = data.title || "Instagram Video";
    const duration = this.formatDuration(data.duration || 0);
    const thumbnail = data.thumbnail || "/placeholder.svg?height=180&width=320";
    const views = this.formatViews(data.view_count || 0);

    // Extract available formats
    const formats = this.extractFormats(data);

    return {
      title,
      thumbnail,
      duration,
      views,
      platform: "Instagram",
      formats,
    };
  }

  private static extractFormats(data: any): VideoData["formats"] {
    const formats: VideoData["formats"] = [];

    // Add video formats
    if (data.formats) {
      const videoFormats = data.formats
        .filter((f: YtDlpFormat) => f.vcodec !== "none" && f.acodec !== "none")
        .map(
          (f: YtDlpFormat): VideoFormat => ({
            type: "video",
            quality: `${f.height}p`,
            size: this.formatSize(f.filesize || 0),
            format: "MP4",
          })
        );

      // Remove duplicates and sort by quality
      const formatMap = new Map<string, VideoFormat>();
      videoFormats.forEach((format: VideoFormat) => {
        formatMap.set(format.quality, format);
      });

      const uniqueFormats = Array.from(formatMap.values()).sort(
        (a: VideoFormat, b: VideoFormat) => {
          const heightA = parseInt(a.quality);
          const heightB = parseInt(b.quality);
          return heightB - heightA;
        }
      );

      formats.push(...uniqueFormats);
    }

    // Add audio format if available
    if (
      data.formats?.some(
        (f: YtDlpFormat) => f.vcodec === "none" && f.acodec !== "none"
      )
    ) {
      const audioFormat: VideoFormat = {
        type: "audio",
        quality: "128kbps",
        size: this.formatSize(
          data.formats.find(
            (f: YtDlpFormat) => f.vcodec === "none" && f.acodec !== "none"
          )?.filesize || 0
        ),
        format: "MP3",
      };
      formats.push(audioFormat);
    }

    return formats;
  }

  private static formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  private static formatViews(count: number): string {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  }

  private static formatSize(bytes: number): string {
    if (bytes === 0) return "Unknown size";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }
}
