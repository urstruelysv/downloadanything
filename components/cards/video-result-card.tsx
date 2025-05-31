"use client"

import { Play, Clock, Eye } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { VideoData, VideoFormat } from "@/types/video"
import { DownloadFormatItem } from "./download-format-item"

interface VideoResultCardProps {
  videoData: VideoData
  onDownload: (format: VideoFormat) => void
  downloadingFormat: string | null
  downloadError?: string | null
  onClearError?: () => void
  currentUrl?: string
}

export function VideoResultCard({
  videoData,
  onDownload,
  downloadingFormat,
  downloadError,
  onClearError,
  currentUrl,
}: VideoResultCardProps) {
  return (
    <Card className="max-w-4xl mx-auto mb-12 shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
      <CardContent className="p-6">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Video Preview */}
          <div className="md:col-span-1">
            <div className="relative rounded-lg overflow-hidden bg-gray-100">
              <img
                src={videoData.thumbnail || "/placeholder.svg?height=180&width=320"}
                alt={videoData.title}
                className="w-full aspect-video object-cover"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                  <Play className="w-6 h-6 text-gray-700 ml-1" />
                </div>
              </div>
              <Badge className="absolute top-2 right-2 bg-black/70 text-white">{videoData.platform}</Badge>
            </div>
          </div>

          {/* Video Info & Downloads */}
          <div className="md:col-span-2 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{videoData.title}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {videoData.duration}
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {videoData.views} views
                </div>
              </div>
            </div>

            {/* Download Error Alert */}
            {downloadError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {downloadError}
                  {onClearError && (
                    <button onClick={onClearError} className="ml-2 text-red-600 hover:text-red-800 underline">
                      Dismiss
                    </button>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Download Options */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Download Options:</h4>
              <div className="grid gap-2">
                {videoData.formats.map((format, index) => {
                  const formatKey = `${format.type}_${format.quality}`
                  const hasError = downloadError?.includes(format.quality) && downloadError?.includes(format.format)

                  return (
                    <DownloadFormatItem
                      key={index}
                      format={format}
                      onDownload={onDownload}
                      isDownloading={downloadingFormat === formatKey}
                      hasError={hasError}
                      videoUrl={currentUrl}
                      platform={videoData.platform}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
