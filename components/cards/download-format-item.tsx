"use client"

import { Video, Music, Download, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { VideoFormat } from "@/types/video"

interface DownloadFormatItemProps {
  format: VideoFormat
  onDownload: (format: VideoFormat) => void
  isDownloading: boolean
  hasError?: boolean
}

export function DownloadFormatItem({ format, onDownload, isDownloading, hasError }: DownloadFormatItemProps) {
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
      <Button
        size="sm"
        onClick={() => onDownload(format)}
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
  )
}
