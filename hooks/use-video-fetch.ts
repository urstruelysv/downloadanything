"use client"

import { useState } from "react"
import type { VideoData, ApiResponse } from "@/types/video"

export function useVideoFetch() {
  const [loading, setLoading] = useState(false)
  const [videoData, setVideoData] = useState<VideoData | null>(null)
  const [error, setError] = useState("")

  const fetchVideo = async (url: string): Promise<void> => {
    setLoading(true)
    setError("")
    setVideoData(null)

    try {
      const response = await fetch("/api/fetch-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      const result: ApiResponse<VideoData> = await response.json()

      if (result.success && result.data) {
        setVideoData(result.data)
      } else {
        setError(result.error || "Failed to fetch video data")
      }
    } catch (err) {
      setError("Network error occurred")
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    videoData,
    error,
    fetchVideo,
  }
}
