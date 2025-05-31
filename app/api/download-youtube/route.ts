import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import { promises as fs } from "fs"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const { url, format, quality } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Validate YouTube URL
    const videoId = extractVideoId(url)
    if (!videoId) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 })
    }

    try {
      // Check if yt-dlp is available
      const ytdlpAvailable = await checkYtDlpAvailable()
      if (!ytdlpAvailable) {
        return NextResponse.json(
          {
            error: "yt-dlp is not installed. Please install it with: pip install yt-dlp",
          },
          { status: 500 },
        )
      }

      // Create temporary directory
      const tempDir = path.join(process.cwd(), "temp")
      try {
        await fs.access(tempDir)
      } catch {
        await fs.mkdir(tempDir, { recursive: true })
      }

      const timestamp = Date.now()
      const outputTemplate = path.join(tempDir, `${videoId}_${timestamp}.%(ext)s`)

      const fileBuffer = await downloadWithYtDlp(url, format, quality, outputTemplate, videoId, timestamp, tempDir)

      // Return file
      const mimeType = format === "audio" ? "audio/mpeg" : "video/mp4"
      const extension = format === "audio" ? "mp3" : "mp4"
      const filename = `youtube_${videoId}_${quality}.${extension}`

      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": fileBuffer.length.toString(),
        },
      })
    } catch (downloadError) {
      console.error("Download error:", downloadError)
      return NextResponse.json(
        {
          error: `Download failed: ${downloadError instanceof Error ? downloadError.message : "Unknown error"}`,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function checkYtDlpAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const process = spawn("yt-dlp", ["--version"], { stdio: "pipe" })

    process.on("close", (code) => {
      resolve(code === 0)
    })

    process.on("error", () => {
      resolve(false)
    })

    // Timeout after 5 seconds
    setTimeout(() => {
      process.kill()
      resolve(false)
    }, 5000)
  })
}

async function downloadWithYtDlp(
  url: string,
  format: string,
  quality: string,
  outputTemplate: string,
  videoId: string,
  timestamp: number,
  tempDir: string,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    let ytdlArgs: string[]

    if (format === "audio") {
      // Download audio only
      ytdlArgs = [
        "-x",
        "--audio-format",
        "mp3",
        "--audio-quality",
        quality === "320kbps" ? "0" : "5",
        "-o",
        outputTemplate,
        url,
      ]
    } else {
      // Download video
      const formatSelector = getFormatSelector(quality)
      ytdlArgs = ["-f", formatSelector, "-o", outputTemplate, url]
    }

    console.log("Executing yt-dlp with args:", ytdlArgs)

    const ytdlProcess = spawn("yt-dlp", ytdlArgs, {
      stdio: ["pipe", "pipe", "pipe"],
    })

    let stdout = ""
    let stderr = ""

    ytdlProcess.stdout?.on("data", (data: Buffer) => {
      stdout += data.toString()
    })

    ytdlProcess.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString()
    })

    ytdlProcess.on("close", async (code: number) => {
      if (code !== 0) {
        console.error("yt-dlp stderr:", stderr)
        reject(new Error(`yt-dlp failed with code ${code}: ${stderr}`))
        return
      }

      try {
        // Find the downloaded file
        const files = await fs.readdir(tempDir)
        const downloadedFiles = files.filter((file: string) => file.startsWith(`${videoId}_${timestamp}`))

        if (downloadedFiles.length === 0) {
          reject(new Error("Download failed - no file created"))
          return
        }

        const downloadedFile = path.join(tempDir, downloadedFiles[0])
        const fileBuffer = await fs.readFile(downloadedFile)

        // Clean up
        await fs.unlink(downloadedFile)

        resolve(fileBuffer)
      } catch (fileError) {
        reject(new Error(`File processing failed: ${fileError}`))
      }
    })

    ytdlProcess.on("error", (error: Error) => {
      reject(new Error(`Failed to start yt-dlp: ${error.message}`))
    })

    // Timeout after 5 minutes
    setTimeout(() => {
      ytdlProcess.kill()
      reject(new Error("Download timeout - process took too long"))
    }, 300000)
  })
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}

function getFormatSelector(quality: string): string {
  switch (quality) {
    case "1080p":
      return "bestvideo[height<=1080]+bestaudio/best[height<=1080]"
    case "720p":
      return "bestvideo[height<=720]+bestaudio/best[height<=720]"
    case "480p":
      return "bestvideo[height<=480]+bestaudio/best[height<=480]"
    case "360p":
      return "bestvideo[height<=360]+bestaudio/best[height<=360]"
    default:
      return "best"
  }
}
