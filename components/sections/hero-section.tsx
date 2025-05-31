import { PlatformIcons } from "@/components/ui/platform-icons"

export function HeroSection() {
  return (
    <div className="text-center mb-12">
      <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
        Download Videos from
        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Anywhere</span>
      </h2>
      <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
        Paste any video URL and download it instantly. Support for YouTube, Instagram, Facebook, Twitter, and more.
      </p>
      <PlatformIcons />
    </div>
  )
}
