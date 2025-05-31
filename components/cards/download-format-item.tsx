"use client"

import { useState } from "react"
import { Video, Music, Download, Loader2, AlertCircle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { VideoFormat } from "@/types/video"

interface DownloadFormatItemProps {
  format: VideoFormat
  onDownload: (format: VideoFormat) => void
  isDownloading: boolean
  hasError?: boolean
  videoUrl?: string
  platform?: string
}

export function DownloadFormatItem({
  format,
  onDownload,
  isDownloading,
  hasError,
  videoUrl,
  platform,
}: DownloadFormatItemProps) {
  const [showFallback, setShowFallback] = useState(false)

  const handleDownload = () => {
    onDownload(format)
  }

  const handleFallbackClick = () => {
    if (!videoUrl) return

    // Open fallback download site based on platform
    if (platform === "YouTube") {
      const videoId = extractYouTubeId(videoUrl)
      if (videoId) {
        const fallbackUrl = `https://api.vevioz.com/api/button/${format.type === "audio" ? "mp3" : "mp4"}/${videoId}`
        window.open(fallbackUrl, "_blank")
      }
    } else if (platform === "Instagram") {
      window.open(`https://snapinsta.app/?url=${encodeURIComponent(videoUrl)}`, "_blank")
    } else if (platform === "TikTok") {
      window.open(`https://snaptik.app/en?url=${encodeURIComponent(videoUrl)}`, "_blank")
    }
  }

  function extractYouTubeId(url: string): string | null {
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

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
        hasError ? "bg-red-50 border border-red-200" : "bg-gray-50 hover:bg-gray-100"
      }`}
    >
      <div className="flex items-center gap-3">
        {format.type === "video" ? (
          <Video className={`w-5 h-5 ${hasError ? "text-red-500" : "text-blue-500"}`} />
        ) : (
          <Music className={`w-5 h-5 ${hasError ? "text-red-500" : "text-green-500"}`} />
        )}
        <div>
          <div className="font-medium text-sm">
            {format.quality} {format.format}
          </div>
          <div className={`text-xs ${hasError ? "text-red-500" : "text-gray-500"}`}>
            {hasError ? "Download failed" : format.size}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        {hasError && videoUrl && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleFallbackClick}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Alternative
          </Button>
        )}
        <Button
          size="sm"
          onClick={handleDownload}
          disabled={isDownloading}
          variant={hasError ? "destructive" : "default"}
          className={
            hasError
              ? ""
              : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
          }
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              Downloading...
            </>
          ) : hasError ? (
            <>
              <AlertCircle className="w-4 h-4 mr-1" />
              Retry
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-1" />
              Download
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
