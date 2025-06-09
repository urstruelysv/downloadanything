// File: src/components/hero/hero-section.tsx
"use client";

import { PlatformIcons } from "@/components/ui/platform-icons";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UrlInputForm } from "../forms/url-input-form";
import { VideoPreview } from "../ui/video-preview";
import { Loader2, Download, AlertCircle } from "lucide-react";

export function HeroSection() {
  // ---------------------------------------------------
  // 1) State for the "Download from X" animation:
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentPlatform, setCurrentPlatform] = useState(0);
  const platforms = ["YouTube", "Instagram", "TikTok", "Twitter", "Facebook"];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  const [isUrlVerified, setIsUrlVerified] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlatform((prev) => (prev + 1) % platforms.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [platforms.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsDownloading(true);
      setTimeout(() => setIsDownloading(false), 2500);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // ---------------------------------------------------
  // 2) State + handler for the URL-input form:
  const handleUrlSubmit = async (url: string) => {
    setError("");
    setLoading(true);
    setIsUrlVerified(false);

    try {
      // First verify the URL by fetching video info
      const response = await fetch("/api/video-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error("Invalid URL or video not available");
      }

      // If we get here, the URL is valid
      setUrl(url);
      setIsUrlVerified(true);
    } catch (error) {
      console.error("URL verification error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Invalid URL or video not available"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format: string, quality: string) => {
    setError("");
    setLoading(true);

    try {
      const requestBody = {
        url: url,
      };

      // Determine the correct endpoint based on the URL
      let endpoint = "/api/download-youtube";
      if (url.includes("instagram.com") || url.includes("instagr.am")) {
        endpoint = "/api/download-instagram";
      } else if (url.includes("tiktok.com") || url.includes("vm.tiktok.com")) {
        endpoint = "/api/download-tiktok";
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      // Handle streaming response with progress
      const reader = response.body?.getReader();
      if (!reader) throw new Error("Failed to get response reader");

      let receivedLength = 0;
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        // Check if this chunk contains progress information
        const text = new TextDecoder().decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (!line) continue;
          try {
            const data = JSON.parse(line);
            if (data.type === "progress") {
              // Update progress in UI
              setProgress(data.progress);
            }
          } catch (e) {
            // Not a JSON line, continue
          }
        }
      }

      // Combine chunks into a single Uint8Array
      const chunksAll = new Uint8Array(receivedLength);
      let position = 0;
      for (const chunk of chunks) {
        chunksAll.set(chunk, position);
        position += chunk.length;
      }

      // Create blob and download
      const blob = new Blob([chunksAll], { type: "video/mp4" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `instagram_video_${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      console.log("Download completed successfully");
    } catch (error) {
      console.error("Download error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Download failed. Please try again."
      );
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  // ---------------------------------------------------
  return (
    <section className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 dark:bg-dark">
      <div className="relative max-w-7xl mx-auto">
        {/** ====== Make a two‐column grid on lg & up, stacked on smaller screens ====== **/}
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-8">
          {/* ---------------------- */}
          {/* LEFT SIDE: Headings + Icons + Professional Text */}
          <div className="z-10 flex flex-col items-start text-left space-y-6">
            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight">
                Download{" "}
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  anything
                </span>
              </h1>
            </motion.div>

            {/* Subheadline with rotating platform */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="flex items-center justify-start space-x-2"
            >
              <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
                from
              </span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentPlatform}
                  initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-600 dark:text-gray-300"
                >
                  {platforms[currentPlatform]}
                </motion.span>
              </AnimatePresence>
            </motion.div>

            {/* Supporting Copy */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-xl"
            >
              Experience the next generation of content downloading. Our
              advanced technology ensures seamless, high-quality downloads from
              any platform with enterprise-grade security and lightning-fast
              processing.
            </motion.p>

            {/* Platform Icons Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
              className="flex justify-start"
            >
              <PlatformIcons />
            </motion.div>

            {/* Professional Feature Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
              className="space-y-4 max-w-lg"
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mt-2"></div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Universal Compatibility
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Support for 1000+ platforms including YouTube, Instagram,
                    TikTok, and more
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full mt-2"></div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Premium Quality
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Download in original quality up to 4K resolution with no
                    compression
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full mt-2"></div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Lightning Fast
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Advanced algorithms ensure maximum download speeds and
                    minimal wait times
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ---------------------- */}
          {/* RIGHT SIDE: Animated Graphic */}
          <div className="relative flex justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative w-48 h-48 sm:w-64 sm:h-64 lg:w-80 lg:h-80 xl:w-96 xl:h-96"
            >
              <motion.div
                animate={{ scale: isDownloading ? 1.05 : 1 }}
                transition={{ scale: { duration: 0.3 } }}
                className="relative w-full h-full"
              >
                {/* Outer gradient + shadow */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 to-purple-100/30 dark:from-gray-800/30 dark:to-gray-900/30 rounded-full shadow-2xl dark:shadow-blue-900/20" />

                {/* Inner colored circle + icon */}
                <div className="absolute inset-4 sm:inset-6 lg:inset-8 bg-gradient-to-br from-blue-500/80 to-purple-600/80 dark:from-blue-400/80 dark:to-purple-500/80 rounded-full flex items-center justify-center shadow-xl dark:shadow-blue-500/10 overflow-hidden">
                  <motion.img
                    src="/anything.png"
                    alt="Download Icon"
                    className="w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 xl:w-40 xl:h-40 object-contain opacity-90"
                    animate={{ y: isDownloading ? [0, -6, 6, 0] : 0 }}
                    transition={{
                      duration: 0.8,
                      repeat: isDownloading ? 1 : 0,
                      ease: "easeInOut",
                    }}
                  />
                </div>

                {/* Progress Ring */}
                <AnimatePresence>
                  {isDownloading && (
                    <motion.svg
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 w-full h-full -rotate-90"
                      viewBox="0 0 100 100"
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        fill="none"
                        className="text-blue-200/50 dark:text-gray-700/50"
                      />
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="45"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        className="text-blue-500/70 dark:text-blue-300/70"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2.2, ease: "easeInOut" }}
                      />
                    </motion.svg>
                  )}
                </AnimatePresence>

                {/* Floating Particles */}
                <AnimatePresence>
                  {isDownloading &&
                    [...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{
                          opacity: 0,
                          scale: 0,
                          x: 20 + Math.random() * 80,
                          y: 20 + Math.random() * 80,
                        }}
                        animate={{
                          opacity: [0, 0.8, 0],
                          scale: [0, 1, 0],
                          y: [0, -40, -80],
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                          duration: 2,
                          delay: i * 0.2,
                          ease: "easeOut",
                        }}
                        className="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-blue-400/60 to-purple-500/60 dark:from-blue-300/60 dark:to-purple-400/60 rounded-full"
                      />
                    ))}
                </AnimatePresence>

                {/* Background blur circle */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-600/10 dark:from-blue-400/10 dark:to-purple-500/10 rounded-full blur-3xl -z-10 scale-125" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* URL INPUT FORM */}
      <div className="flex mt-24 w-full px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl mx-auto shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.2)] rounded-lg">
          <UrlInputForm
            onSubmit={handleUrlSubmit}
            loading={loading}
            error={error}
          />
        </div>
      </div>

      {/* Video Preview and Options - Only show after URL verification */}
      {isUrlVerified && (
        <div className="mt-8 w-full max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6">
              <VideoPreview
                url={url}
                onDownload={() => handleDownload("mp4", "1080p")}
                loading={loading}
                error={error}
              />

              {/* Download Button with Progress */}
              <button
                onClick={() => handleDownload("mp4", "1080p")}
                disabled={loading}
                className={`w-full py-4 px-6 rounded-lg text-white font-medium flex items-center justify-center transition-all duration-300 relative overflow-hidden ${
                  loading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600 hover:shadow-lg"
                }`}
              >
                {loading ? (
                  <>
                    <div
                      className="absolute inset-0 bg-blue-600 transition-all duration-300 ease-in-out"
                      style={{ width: `${progress}%` }}
                    />
                    <div className="relative z-10 flex items-center justify-center w-full">
                      <div className="w-full max-w-xs bg-white/20 rounded-full h-2">
                        <div
                          className="bg-white h-2 rounded-full transition-all duration-300 ease-in-out"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Download Video
                  </>
                )}
              </button>

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
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
