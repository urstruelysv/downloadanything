import Image from "next/image";
import { useState } from "react";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { useRouter } from "next/navigation";
export function Header() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return (
    <>
      <header className="border-b border-gray-100 w-full h-20 mt-4 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md sticky top-0 z-50 shadow-sm dark:shadow-gray-900/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo Section */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-2 shadow-lg">
                  <Image
                    src="/anything.png"
                    alt="Download Anything"
                    width={24}
                    height={24}
                    className="w-full h-full object-contain filter brightness-0 invert"
                    onClick={() => router.push("/")}
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  DownloadAnything
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide ">
                  Universal Download Solution
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center">
              <div className="flex items-center gap-8">
                <a
                  href="#features"
                  className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-200 hover:scale-105"
                >
                  Features
                </a>
                <a
                  href="#how-to-use"
                  className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-200 hover:scale-105"
                >
                  How It Works
                </a>
                <a
                  href="#contact"
                  className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-200 hover:scale-105"
                >
                  Support
                </a>
                <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2"></div>
                <DarkModeToggle />
              </div>
            </nav>

            {/* Mobile Menu Controls */}
            <div className="md:hidden flex items-center gap-2">
              <DarkModeToggle />
              <button
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle mobile menu"
              >
                <svg
                  className={`w-5 h-5 text-gray-600 dark:text-gray-300 transition-transform duration-200 ${
                    isMobileMenuOpen ? "rotate-90" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={
                      isMobileMenuOpen
                        ? "M6 18L18 6M6 6l12 12"
                        : "M4 6h16M4 12h16M4 18h16"
                    }
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-lg">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <nav className="flex flex-col gap-4">
              <a
                href="#features"
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#how-to-use"
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                How It Works
              </a>
              <a
                href="#contact"
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Support
              </a>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
