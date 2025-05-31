"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HeroSection } from "@/components/sections/hero-section"
import { UrlInputForm } from "@/components/forms/url-input-form"
import { VideoResultCard } from "@/components/cards/video-result-card"
import { HowToUseSection } from "@/components/sections/how-to-use-section"
import { InstallationGuide } from "@/components/ui/installation-guide"
import { useVideoFetch } from "@/hooks/use-video-fetch"
import { useDownload } from "@/hooks/use-download"
import type { VideoFormat } from "@/types/video"

export default function HomePage() {
  const [currentUrl, setCurrentUrl] = useState("")
  const [showInstallGuide, setShowInstallGuide] = useState(false)
  const { loading, videoData, error, fetchVideo } = useVideoFetch()
  const { downloadingFormat, downloadError, download, clearError } = useDownload()

  const handleUrlSubmit = (url: string) => {
    setCurrentUrl(url)
    fetchVideo(url)
  }

  const handleDownload = (format: VideoFormat) => {
    if (videoData && currentUrl) {
      download(format, videoData.title, currentUrl)
    }
  }

  // Show installation guide if download fails due to missing yt-dlp
  useEffect(() => {
    if (
      downloadError &&
      (downloadError.includes("yt-dlp is not installed") || downloadError.includes("Failed to start yt-dlp"))
    ) {
      setShowInstallGuide(true)
    }
  }, [downloadError])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <HeroSection />

        {showInstallGuide && <InstallationGuide />}

        <UrlInputForm onSubmit={handleUrlSubmit} loading={loading} error={error} />

        {videoData && (
          <VideoResultCard
            videoData={videoData}
            onDownload={handleDownload}
            downloadingFormat={downloadingFormat}
            downloadError={downloadError}
            onClearError={clearError}
            currentUrl={currentUrl}
          />
        )}

        <HowToUseSection />
      </main>

      <Footer />
    </div>
  )
}
