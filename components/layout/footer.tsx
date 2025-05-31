import { Download } from "lucide-react"

export function Footer() {
  return (
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
  )
}
