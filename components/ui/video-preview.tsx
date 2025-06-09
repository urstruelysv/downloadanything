import { useState, useEffect } from "react";
import { Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface VideoPreviewProps {
  url: string;
  onDownload: (format: string, quality: string) => void;
  loading: boolean;
  error: string;
}

export function VideoPreview({
  url,
  onDownload,
  loading,
  error,
}: VideoPreviewProps) {
  const [selectedFormat, setSelectedFormat] = useState<"video" | "audio">(
    "video"
  );
  const [selectedQuality, setSelectedQuality] = useState<string>("720p");
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);

  // Fetch video info when URL changes
  useEffect(() => {
    const fetchVideoInfo = async () => {
      setLoadingInfo(true);
      try {
        const response = await fetch("/api/video-info", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch video info");
        }

        const data = await response.json();
        setVideoInfo(data);
      } catch (error) {
        console.error("Error fetching video info:", error);
      } finally {
        setLoadingInfo(false);
      }
    };

    if (url) {
      fetchVideoInfo();
    }
  }, [url]);

  const videoQualities = [
    { value: "1080p", label: "1080p HD" },
    { value: "720p", label: "720p HD" },
    { value: "480p", label: "480p" },
    { value: "360p", label: "360p" },
  ];

  const audioQualities = [
    { value: "320kbps", label: "320 kbps (High)" },
    { value: "128kbps", label: "128 kbps (Medium)" },
  ];

  if (loadingInfo) {
    return (
      <div className="w-full max-w-3xl mx-auto mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600 dark:text-gray-300">
            Loading video info...
          </span>
        </div>
      </div>
    );
  }

  if (!videoInfo) {
    return null;
  }

  return (
    <div className="w-full max-w-3xl mx-auto mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Video Preview */}
      <div className="aspect-video w-full bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden mb-6">
        <img
          src={videoInfo.thumbnail}
          alt={videoInfo.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Video Title and Info */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {videoInfo.title}
        </h2>
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 space-x-4">
          <span>{videoInfo.uploader}</span>
          <span>•</span>
          <span>{videoInfo.viewCount?.toLocaleString()} views</span>
          <span>•</span>
          <span>{new Date(videoInfo.uploadDate).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Format Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Format
        </label>
        <div className="flex gap-4">
          <button
            onClick={() => setSelectedFormat("video")}
            className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
              selectedFormat === "video"
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
            }`}
          >
            Video
          </button>
          <button
            onClick={() => setSelectedFormat("audio")}
            className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
              selectedFormat === "audio"
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
            }`}
          >
            Audio
          </button>
        </div>
      </div>

      {/* Quality Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Quality
        </label>
        <div className="grid grid-cols-2 gap-4">
          {(selectedFormat === "video" ? videoQualities : audioQualities).map(
            (quality) => (
              <button
                key={quality.value}
                onClick={() => setSelectedQuality(quality.value)}
                className={`py-2 px-4 rounded-lg border transition-colors ${
                  selectedQuality === quality.value
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                }`}
              >
                {quality.label}
              </button>
            )
          )}
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={() => onDownload(selectedFormat, selectedQuality)}
        disabled={loading}
        className={`w-full py-3 px-4 rounded-lg text-white font-medium flex items-center justify-center transition-colors ${
          loading
            ? "bg-blue-400 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Downloading...
          </>
        ) : (
          <>
            <Download className="w-5 h-5 mr-2" />
            Download {selectedFormat === "video" ? "Video" : "Audio"}
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <div className="flex items-center text-red-700 dark:text-red-300">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}
