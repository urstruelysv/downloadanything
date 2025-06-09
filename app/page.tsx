"use client";
import { useState, useEffect, createContext, useContext } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/components/sections/hero-section";

import { VideoResultCard } from "@/components/cards/video-result-card";
import { HowToUseSection } from "@/components/sections/how-to-use-section";
import { InstallationGuide } from "@/components/ui/installation-guide";
import { useVideoFetch } from "@/hooks/use-video-fetch";
import { useDownload } from "@/hooks/use-download";
import type { VideoFormat } from "@/types/video";

// Theme Context
interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// Theme Provider Component
const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check for stored theme preference or system preference
    const storedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (storedTheme === "dark" || (!storedTheme && systemPrefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDark(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);

    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return <div className="min-h-screen bg-white">{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Main HomePage Component
function HomePageContent() {
  const [currentUrl, setCurrentUrl] = useState("");
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const { loading, videoData, error, fetchVideo } = useVideoFetch();
  const { downloadingFormat, downloadError, download, clearError } =
    useDownload();

  const handleUrlSubmit = (url: string) => {
    setCurrentUrl(url);
    fetchVideo(url);
  };

  const handleDownload = (format: VideoFormat) => {
    if (videoData && currentUrl) {
      download(format, videoData.title, currentUrl);
    }
  };

  // Show installation guide if download fails due to missing yt-dlp
  useEffect(() => {
    if (
      downloadError &&
      (downloadError.includes("yt-dlp is not installed") ||
        downloadError.includes("Failed to start yt-dlp"))
    ) {
      setShowInstallGuide(true);
    }
  }, [downloadError]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900/20 transition-colors duration-300">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <HeroSection />
        {showInstallGuide && <InstallationGuide />}

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
  );
}

// Exported HomePage with Theme Provider
export default function HomePage() {
  return (
    <ThemeProvider>
      <HomePageContent />
    </ThemeProvider>
  );
}
