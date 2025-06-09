"use client";

import { useState } from "react";
import { Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

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
    <div className="w-full max-w-3xl mx-auto mb-8 px-4 sm:px-0">
      <div className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4">
          {/* Input field */}
          <div className="relative flex-1">
            <input
              type="text"
              value={url}
              onChange={handleChange}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="Paste a YouTube, TikTok, Instagram, etc. link…"
              className={`
                w-full h-12 px-4 pr-10 text-base rounded-lg border transition 
                bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 
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
              <div className="absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none">
                {isValidUrl ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
            )}
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={loading || !url.trim() || !isValidUrl}
            className={`
              flex items-center justify-center h-12 px-6 rounded-lg text-white 
              transition disabled:opacity-50
              ${
                loading
                  ? "bg-blue-500 cursor-default"
                  : "bg-blue-600 hover:bg-blue-700"
              }
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

        {/* Error message (if any) */}
        {error && (
          <div className="mt-2 px-4 pb-4">
            <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md p-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
