import { PlatformIcons } from "@/components/ui/platform-icons";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function HeroSection() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentPlatform, setCurrentPlatform] = useState(0);

  const platforms = ["YouTube", "Instagram", "TikTok", "Twitter", "Facebook"];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlatform((prev) => (prev + 1) % platforms.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsDownloading(true);
      setTimeout(() => setIsDownloading(false), 2500);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24 dark:bg-dark ">
      <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16">
        {/* Content Section */}
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-6 sm:mb-8"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 dark:text-white dark:bg-gradient-to-r dark:from-blue-400 dark:to-purple-500 dark:bg-clip-text dark:text-transparent leading-tight mg-2">
              Download{" "}
              <span className="relative">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent "
                >
                  anything
                </motion.span>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="absolute -bottom-1 sm:-bottom-2 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-blue-600/30 via-purple-600/30 to-indigo-600/30 rounded-full origin-left"
                />
              </span>
            </h1>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 dark:text-white leading-tight mt-1 sm:mt-2">
              from{" "}
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentPlatform}
                  initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -20, filter: "blur(4px)" }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="inline-block text-gray-600 dark:text-gray-300"
                >
                  {platforms[currentPlatform]}
                </motion.span>
              </AnimatePresence>
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 sm:mb-10 leading-relaxed max-w-2xl"
          >
            Paste any video URL and download it instantly. Fast, reliable, and
            supports all major platforms.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          >
            <PlatformIcons />
          </motion.div>
        </div>

        {/* Visual Element */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="flex-shrink-0 mt-12 sm:mt-16 lg:mt-0 flex justify-center lg:justify-end"
        >
          <div className="relative">
            <motion.div
              animate={{
                scale: isDownloading ? 1.05 : 1,
              }}
              transition={{
                scale: { duration: 0.3 },
              }}
              className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-800 dark:to-gray-900 rounded-full shadow-lg dark:shadow-blue-900/50" />

              {/* PNG icon instead of SVG */}
              <div className="absolute inset-3 sm:inset-4 bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 rounded-full flex items-center justify-center shadow-lg dark:shadow-blue-500/20 overflow-hidden">
                <motion.img
                  src="/anything.png"
                  alt="Download Icon"
                  width={48}
                  height={48}
                  className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 object-contain"
                  animate={{
                    y: isDownloading ? [0, -3, 3, 0] : 0,
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: isDownloading ? 2 : 0,
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
                      strokeWidth="2"
                      fill="none"
                      className="text-blue-200 dark:text-gray-700"
                    />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                      className="text-blue-500 dark:text-blue-300"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2.2, ease: "easeInOut" }}
                    />
                  </motion.svg>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Floating Particles */}
            <AnimatePresence>
              {isDownloading &&
                [...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{
                      opacity: 0,
                      scale: 0,
                      x: 14 + Math.random() * 84,
                      y: 14 + Math.random() * 84,
                    }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                      y: [0, -25, -50],
                    }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.2,
                      ease: "easeOut",
                    }}
                    className="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-blue-400 to-purple-500 dark:from-blue-300 dark:to-purple-400 rounded-full"
                  />
                ))}
            </AnimatePresence>

            {/* Ambient Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-600/10 dark:from-blue-400/10 dark:to-purple-500/10 rounded-full blur-xl -z-10" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
