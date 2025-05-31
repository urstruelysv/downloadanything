"use client"

import { useState } from "react"
import {
  Download,
  Play,
  Clock,
  Eye,
  Globe,
  Youtube,
  Facebook,
  Instagram,
  Twitter,
  Video,
  Music,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface VideoData {
  title: string
  thumbnail: string
  duration: string
  views: string
  platform: string
  formats: {
    type: "video" | "audio"
    quality: string
    size: string
    format: string
  }[]
}

export default function DownloadSomething() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [videoData, setVideoData] = useState<VideoData | null>(null)
  const [error, setError] = useState("")
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null)

  const detectPlatform = (url: string) => {
    const cleanUrl = url.toLowerCase().trim()

    // YouTube
    if (cleanUrl.includes("youtube.com") || cleanUrl.includes("youtu.be") || cleanUrl.includes("m.youtube.com")) {
      return "YouTube"
    }

    // Instagram
    if (cleanUrl.includes("instagram.com") || cleanUrl.includes("instagr.am")) {
      return "Instagram"
    }

    // Facebook
    if (
      cleanUrl.includes("facebook.com") ||
      cleanUrl.includes("fb.watch") ||
      cleanUrl.includes("fb.com") ||
      cleanUrl.includes("m.facebook.com")
    ) {
      return "Facebook"
    }

    // Twitter/X
    if (cleanUrl.includes("twitter.com") || cleanUrl.includes("x.com") || cleanUrl.includes("t.co")) {
      return "Twitter"
    }

    // TikTok
    if (cleanUrl.includes("tiktok.com") || cleanUrl.includes("vm.tiktok.com")) {
      return "TikTok"
    }

    // Vimeo
    if (cleanUrl.includes("vimeo.com")) {
      return "Vimeo"
    }

    return "Unknown"
  }

  const validateUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      // Check if it's a partial URL that might work
      if (
        url.includes(".") &&
        (url.includes("youtube") ||
          url.includes("instagram") ||
          url.includes("facebook") ||
          url.includes("twitter") ||
          url.includes("tiktok"))
      ) {
        return true
      }
      return false
    }
  }

  const getPlatformSpecificData = (platform: string, url: string): VideoData => {
    const baseData = {
      thumbnail: "/placeholder.svg?height=180&width=320",
      platform,
    }

    switch (platform) {
      case "YouTube":
        return {
          ...baseData,
          title: "Amazing YouTube Video - Tutorial & Tips",
          duration: "12:34",
          views: "2.1M",
          formats: [
            { type: "video", quality: "4K", size: "156.8 MB", format: "MP4" },
            { type: "video", quality: "1080p", size: "89.2 MB", format: "MP4" },
            { type: "video", quality: "720p", size: "45.1 MB", format: "MP4" },
            { type: "video", quality: "480p", size: "28.5 MB", format: "MP4" },
            { type: "audio", quality: "320kbps", size: "11.8 MB", format: "MP3" },
            { type: "audio", quality: "128kbps", size: "4.7 MB", format: "MP3" },
          ],
        }

      case "Instagram":
        return {
          ...baseData,
          title: "Instagram Reel - Trending Content",
          duration: "0:30",
          views: "847K",
          formats: [
            { type: "video", quality: "1080p", size: "12.3 MB", format: "MP4" },
            { type: "video", quality: "720p", size: "8.1 MB", format: "MP4" },
            { type: "video", quality: "480p", size: "5.2 MB", format: "MP4" },
            { type: "audio", quality: "128kbps", size: "1.1 MB", format: "MP3" },
          ],
        }

      case "Facebook":
        return {
          ...baseData,
          title: "Facebook Video - Viral Content",
          duration: "3:45",
          views: "1.5M",
          formats: [
            { type: "video", quality: "1080p", size: "67.8 MB", format: "MP4" },
            { type: "video", quality: "720p", size: "42.1 MB", format: "MP4" },
            { type: "video", quality: "480p", size: "25.6 MB", format: "MP4" },
            { type: "audio", quality: "128kbps", size: "3.6 MB", format: "MP3" },
          ],
        }

      case "Twitter":
        return {
          ...baseData,
          title: "Twitter Video - Breaking News",
          duration: "1:15",
          views: "523K",
          formats: [
            { type: "video", quality: "720p", size: "18.9 MB", format: "MP4" },
            { type: "video", quality: "480p", size: "12.3 MB", format: "MP4" },
            { type: "audio", quality: "128kbps", size: "1.4 MB", format: "MP3" },
          ],
        }

      case "TikTok":
        return {
          ...baseData,
          title: "TikTok Video - Viral Dance",
          duration: "0:15",
          views: "3.2M",
          formats: [
            { type: "video", quality: "1080p", size: "8.7 MB", format: "MP4" },
            { type: "video", quality: "720p", size: "5.4 MB", format: "MP4" },
            { type: "audio", quality: "128kbps", size: "0.5 MB", format: "MP3" },
          ],
        }

      case "Vimeo":
        return {
          ...baseData,
          title: "Vimeo Video - Creative Content",
          duration: "8:22",
          views: "156K",
          formats: [
            { type: "video", quality: "4K", size: "234.5 MB", format: "MP4" },
            { type: "video", quality: "1080p", size: "98.7 MB", format: "MP4" },
            { type: "video", quality: "720p", size: "54.3 MB", format: "MP4" },
            { type: "audio", quality: "320kbps", size: "8.1 MB", format: "MP3" },
          ],
        }

      default:
        return {
          ...baseData,
          title: "Video Content",
          duration: "5:42",
          views: "1.2M",
          formats: [
            { type: "video", quality: "1080p", size: "45.2 MB", format: "MP4" },
            { type: "video", quality: "720p", size: "28.1 MB", format: "MP4" },
            { type: "audio", quality: "128kbps", size: "3.8 MB", format: "MP3" },
          ],
        }
    }
  }

  const supportedPlatforms = [
    { name: "YouTube", icon: Youtube, color: "text-red-500" },
    { name: "Instagram", icon: Instagram, color: "text-pink-500" },
    { name: "Facebook", icon: Facebook, color: "text-blue-500" },
    { name: "Twitter", icon: Twitter, color: "text-sky-500" },
    { name: "TikTok", icon: Video, color: "text-black" },
    { name: "Vimeo", icon: Play, color: "text-blue-400" },
  ]

  const handleDownload = async () => {
    if (!url.trim()) {
      setError("Please enter a valid URL")
      return
    }

    if (!validateUrl(url)) {
      setError("Please enter a valid URL format")
      return
    }

    const platform = detectPlatform(url)
    if (platform === "Unknown") {
      setError("Unsupported platform. Please use YouTube, Instagram, Facebook, Twitter, TikTok, or Vimeo links.")
      return
    }

    setLoading(true)
    setError("")
    setVideoData(null)

    // Simulate API call with platform-specific responses
    setTimeout(
      () => {
        // Simulate some potential errors
        const random = Math.random()

        if (random < 0.1) {
          setError("This video is private or unavailable")
          setLoading(false)
          return
        }

        if (random < 0.15) {
          setError("This content is region-locked and cannot be downloaded")
          setLoading(false)
          return
        }

        // Get platform-specific mock data
        const mockData = getPlatformSpecificData(platform, url)
        setVideoData(mockData)
        setLoading(false)
      },
      1500 + Math.random() * 1000,
    ) // Random delay between 1.5-2.5 seconds
  }

  const handleFormatDownload = async (format: any) => {
    const formatKey = `${format.type}_${format.quality}`
    setDownloadingFormat(formatKey)

    // Simulate download preparation time
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Create a mock file based on the format type
    let content: string
    let mimeType: string
    let filename: string

    if (format.type === "video") {
      content = "Mock video file content for " + format.quality + " " + format.format
      mimeType = "video/mp4"
      filename = `video_${format.quality}.${format.format.toLowerCase()}`
    } else {
      content = "Mock audio file content for " + format.quality + " " + format.format
      mimeType = "audio/mpeg"
      filename = `audio_${format.quality}.${format.format.toLowerCase()}`
    }

    // Create blob and download
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = filename
    link.style.display = "none"

    document.body.appendChild(link)
    link.click()

    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setDownloadingFormat(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b border-gray-200/50 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  DownloadSomething
                </h1>
                <p className="text-xs text-gray-500">Download anything. From anywhere.</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <a href="#how-to-use" className="text-gray-600 hover:text-gray-900 transition-colors">
                How to Use
              </a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900 transition-colors">
                Contact
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Download Videos from
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}
              Anywhere
            </span>
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Paste any video URL and download it instantly. Support for YouTube, Instagram, Facebook, Twitter, and more.
          </p>

          {/* Supported Platforms */}
          <div className="flex justify-center gap-6 mb-8">
            {supportedPlatforms.map((platform) => (
              <div key={platform.name} className="flex flex-col items-center gap-2 group">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center group-hover:shadow-md transition-shadow">
                  <platform.icon className={`w-6 h-6 ${platform.color}`} />
                </div>
                <span className="text-xs text-gray-500">{platform.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Input Section */}
        <Card className="max-w-2xl mx-auto mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Paste YouTube, Instagram, Facebook, Twitter, TikTok, or Vimeo URL..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="h-12 text-lg border-gray-200 focus:border-blue-400 focus:ring-blue-400/20"
                    onKeyPress={(e) => e.key === "Enter" && handleDownload()}
                  />
                </div>
                <Button
                  onClick={handleDownload}
                  disabled={loading}
                  className="h-12 px-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </>
                  )}
                </Button>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {videoData && (
          <Card className="max-w-4xl mx-auto mb-12 shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Video Preview */}
                <div className="md:col-span-1">
                  <div className="relative rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={videoData.thumbnail || "/placeholder.svg"}
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

                  {/* Download Options */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Download Options:</h4>
                    <div className="grid gap-2">
                      {videoData.formats.map((format, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {format.type === "video" ? (
                              <Video className="w-5 h-5 text-blue-500" />
                            ) : (
                              <Music className="w-5 h-5 text-green-500" />
                            )}
                            <div>
                              <div className="font-medium text-sm">
                                {format.quality} {format.format}
                              </div>
                              <div className="text-xs text-gray-500">{format.size}</div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleFormatDownload(format)}
                            disabled={downloadingFormat === `${format.type}_${format.quality}`}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                          >
                            {downloadingFormat === `${format.type}_${format.quality}` ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                Downloading...
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* How to Use Section */}
        <section id="how-to-use" className="max-w-4xl mx-auto mb-12">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">How to Use DownloadSomething</h3>
            <p className="text-lg text-gray-600">Download videos in just 3 simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                title: "Copy the Link",
                description: "Copy the video link from YouTube, Instagram, Facebook, or any supported platform.",
                icon: Globe,
              },
              {
                step: 2,
                title: "Paste & Process",
                description: "Paste the link into our input field and click the download button.",
                icon: Download,
              },
              {
                step: 3,
                title: "Choose & Download",
                description: "Select your preferred format and quality, then download instantly.",
                icon: CheckCircle,
              },
            ].map((item) => (
              <Card
                key={item.step}
                className="text-center p-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow"
              >
                <CardContent className="p-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-sm font-medium text-blue-600 mb-2">Step {item.step}</div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h4>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200/50 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Download className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-gray-900">DownloadSomething</span>
              </div>
              <p className="text-sm text-gray-600">
                Download anything. From anywhere. Fast, secure, and completely free.
              </p>
            </div>
            <div>
              <h5 className="font-semibold text-gray-900 mb-3">Quick Links</h5>
              <div className="space-y-2 text-sm">
                <a href="#" className="block text-gray-600 hover:text-gray-900 transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="block text-gray-600 hover:text-gray-900 transition-colors">
                  Terms of Use
                </a>
                <a href="#contact" className="block text-gray-600 hover:text-gray-900 transition-colors">
                  Contact
                </a>
              </div>
            </div>
            <div>
              <h5 className="font-semibold text-gray-900 mb-3">Supported Platforms</h5>
              <div className="space-y-2 text-sm text-gray-600">
                <div>YouTube, Instagram</div>
                <div>Facebook, Twitter</div>
                <div>TikTok, Vimeo</div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-6 text-center text-sm text-gray-500">
            © 2024 DownloadSomething. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
