"use client"

import type React from "react"

import { useState } from "react"
import { Download, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface UrlInputFormProps {
  onSubmit: (url: string) => void
  loading: boolean
  error: string
}

export function UrlInputForm({ onSubmit, loading, error }: UrlInputFormProps) {
  const [url, setUrl] = useState("")
  const [isValidUrl, setIsValidUrl] = useState(false)

  const validateUrl = (inputUrl: string) => {
    const supportedPlatforms = [
      "youtube.com",
      "youtu.be",
      "m.youtube.com",
      "instagram.com",
      "instagr.am",
      "tiktok.com",
      "vm.tiktok.com",
      "facebook.com",
      "fb.watch",
      "m.facebook.com",
      "twitter.com",
      "x.com",
      "t.co",
      "vimeo.com",
    ]

    const isValid = supportedPlatforms.some((platform) => inputUrl.toLowerCase().includes(platform))

    setIsValidUrl(isValid)
    return isValid
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputUrl = e.target.value
    setUrl(inputUrl)

    if (inputUrl.trim()) {
      validateUrl(inputUrl)
    } else {
      setIsValidUrl(false)
    }
  }

  const handleSubmit = () => {
    if (!url.trim()) {
      return
    }
    onSubmit(url)
  }

  const getPlaceholderText = () => {
    return "Paste YouTube, Instagram, TikTok, Facebook, Twitter, or Vimeo URL..."
  }

  const getExampleUrls = () => [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://www.instagram.com/p/ABC123/",
    "https://www.tiktok.com/@user/video/123",
    "https://www.facebook.com/watch/?v=123",
  ]

  return (
    <Card className="max-w-2xl mx-auto mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Input
                placeholder={getPlaceholderText()}
                value={url}
                onChange={handleInputChange}
                className={`h-12 text-lg pr-10 transition-colors ${
                  url && isValidUrl
                    ? "border-green-400 focus:border-green-500 focus:ring-green-400/20"
                    : url && !isValidUrl
                      ? "border-red-400 focus:border-red-500 focus:ring-red-400/20"
                      : "border-gray-200 focus:border-blue-400 focus:ring-blue-400/20"
                }`}
                onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
              />
              {url && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {isValidUrl ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              )}
            </div>
            <Button
              onClick={handleSubmit}
              disabled={loading || !url.trim() || !isValidUrl}
              className="h-12 px-8 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 disabled:opacity-50"
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

          {!url && (
            <div className="text-sm text-gray-500">
              <p className="mb-2">Try these example URLs:</p>
              <div className="space-y-1">
                {getExampleUrls().map((exampleUrl, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setUrl(exampleUrl)
                      validateUrl(exampleUrl)
                    }}
                    className="block text-blue-600 hover:text-blue-800 hover:underline text-left"
                  >
                    {exampleUrl}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
