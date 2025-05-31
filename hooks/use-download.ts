"use client"

import { useState } from "react"
import type { VideoFormat } from "@/types/video"
import { downloadFile } from "@/lib/utils/download-helper"

export function useDownload() {
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const download = async (format: VideoFormat, title: string, url?: string): Promise<void> => {
    const formatKey = `${format.type}_${format.quality}`
    setDownloadingFormat(formatKey)
    setDownloadError(null)

    try {
      await downloadFile(format, title, url)
      console.log(`✅ Successfully downloaded: ${title} - ${format.quality} ${format.format}`)
    } catch (error) {
      console.error("❌ Download failed:", error)
      setDownloadError(`Failed to download ${format.quality} ${format.format}: ${error}`)
    } finally {
      setDownloadingFormat(null)
    }
  }

  const clearError = () => setDownloadError(null)

  return {
    downloadingFormat,
    downloadError,
    download,
    clearError,
  }
}
