"use client";

import { useState } from "react";
import {
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Link,
} from "lucide-react";

interface UrlInputFormProps {
  onSubmit: (url: string) => void;
  loading: boolean;
  error: string;
}

export function UrlInputForm({ onSubmit, loading, error }: UrlInputFormProps) {
  const [url, setUrl] = useState("");
  const [isValidUrl, setIsValidUrl] = useState(false);

  const supportedPlatforms = [
    "youtube.com",
    "youtu.be",
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
  ];

  const validateUrl = (input: string) => {
    const isValid = supportedPlatforms.some((p) =>
      input.toLowerCase().includes(p)
    );
    setIsValidUrl(isValid);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);
    validateUrl(value);
  };

  const handleSubmit = () => {
    if (!url.trim() || !isValidUrl) return;
    onSubmit(url.trim());
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Form Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Download Video
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Paste a video URL from any supported platform
          </p>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {/* Input field with icon */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Link className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={url}
                onChange={handleChange}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Paste a YouTube, TikTok, Instagram, etc. link…"
                className={`
                  w-full h-12 pl-10 pr-4 text-base rounded-lg border transition-all
                  bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                  placeholder-gray-400 dark:placeholder-gray-500 
                  focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${
                    url
                      ? isValidUrl
                        ? "border-green-400 focus:ring-green-400/40"
                        : "border-red-400 focus:ring-red-400/40"
                      : "border-gray-200 dark:border-gray-600 focus:ring-blue-400/40"
                  }
                `}
              />

              {/* Validation icon */}
              {url && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  {isValidUrl ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              )}
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={loading || !url.trim() || !isValidUrl}
              className={`
                h-12 px-6 rounded-lg text-white font-medium
                transition-all duration-200 ease-in-out
                flex items-center justify-center min-w-[140px]
                ${
                  loading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                }
                disabled:opacity-50 disabled:cursor-not-allowed
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400/40
              `}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </>
              )}
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-4">
              <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Supported platforms */}
          <div className="mt-4 flex flex-wrap gap-2">
            {supportedPlatforms.map((platform) => (
              <span
                key={platform}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
              >
                {platform}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
