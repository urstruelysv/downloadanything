export interface VideoFormat {
  type: "video" | "audio"
  quality: string
  size: string
  format: string
}

export interface VideoData {
  title: string
  thumbnail: string
  duration: string
  views: string
  platform: string
  formats: VideoFormat[]
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export type Platform = "YouTube" | "Instagram" | "Facebook" | "Twitter" | "TikTok" | "Vimeo" | "Unknown"

export interface PlatformConfig {
  name: string
  icon: any
  color: string
}
