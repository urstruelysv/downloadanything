import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Terminal, Download, CheckCircle } from "lucide-react"

export function InstallationGuide() {
  return (
    <Card className="max-w-4xl mx-auto mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="w-5 h-5" />
          Setup Required: Install yt-dlp
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Download className="h-4 w-4" />
          <AlertDescription>
            To enable real video downloads, you need to install yt-dlp on your server. This is a one-time setup.
          </AlertDescription>
        </Alert>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Using pip (Recommended)
            </h4>
            <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm">pip install yt-dlp</div>
          </div>

          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Using conda
            </h4>
            <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm">
              conda install -c conda-forge yt-dlp
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Using brew (macOS)
            </h4>
            <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm">brew install yt-dlp</div>
          </div>

          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Using apt (Ubuntu/Debian)
            </h4>
            <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm">sudo apt install yt-dlp</div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h5 className="font-semibold text-blue-900 mb-2">For Vercel Deployment:</h5>
          <p className="text-blue-800 text-sm">
            Add a <code className="bg-blue-200 px-1 rounded">requirements.txt</code> file with{" "}
            <code className="bg-blue-200 px-1 rounded">yt-dlp</code> to your project root, or use a custom Docker
            container with yt-dlp pre-installed.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
