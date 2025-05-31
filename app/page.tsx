"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HeroSection } from "@/components/sections/hero-section"
import { UrlInputForm } from "@/components/forms/url-input-form"
import { VideoResultCard } from "@/components/cards/video-result-card"
import { HowToUseSection } from "@/components/sections/how-to-use-section"
import { useVideoFetch } from "@/hooks/use-video-fetch"
import { useDownload } from "@/hooks/use-download"
import type { VideoFormat } from "@/types/video"

export default function HomePage() {
  const [currentUrl, setCurrentUrl] = useState("")
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <HeroSection />

        <UrlInputForm onSubmit={handleUrlSubmit} loading={loading} error={error} />

        {videoData && (
          <VideoResultCard
            videoData={videoData}
            onDownload={handleDownload}
            downloadingFormat={downloadingFormat}
            downloadError={downloadError}
            onClearError={clearError}
          />
        )}

        <HowToUseSection />
      </main>

      <Footer />
    </div>
  )
}
