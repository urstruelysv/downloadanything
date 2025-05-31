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

    // Validate TikTok URL
    if (!url.includes("tiktok.com")) {
      return NextResponse.json({ error: "Invalid TikTok URL" }, { status: 400 })
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
      const outputTemplate = path.join(tempDir, `tiktok_${timestamp}.%(ext)s`)

      const fileBuffer = await downloadWithYtDlp(url, format, outputTemplate, timestamp, tempDir)

      // Return file
      const mimeType = format === "audio" ? "audio/mpeg" : "video/mp4"
      const extension = format === "audio" ? "mp3" : "mp4"
      const filename = `tiktok_${quality}.${extension}`

      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": fileBuffer.length.toString(),
        },
      })
    } catch (downloadError) {
      console.error("TikTok download error:", downloadError)
      return NextResponse.json(
        {
          error: `TikTok download failed: ${downloadError instanceof Error ? downloadError.message : "Unknown error"}`,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("TikTok API error:", error)
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

    setTimeout(() => {
      process.kill()
      resolve(false)
    }, 5000)
  })
}

async function downloadWithYtDlp(
  url: string,
  format: string,
  outputTemplate: string,
  timestamp: number,
  tempDir: string,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    let ytdlArgs: string[]

    if (format === "audio") {
      ytdlArgs = ["-x", "--audio-format", "mp3", "-o", outputTemplate, url]
    } else {
      ytdlArgs = ["-f", "best", "-o", outputTemplate, url]
    }

    console.log("Executing TikTok download:", ytdlArgs)

    const ytdlProcess = spawn("yt-dlp", ytdlArgs, {
      stdio: ["pipe", "pipe", "pipe"],
    })

    let stderr = ""

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
        const files = await fs.readdir(tempDir)
        const downloadedFiles = files.filter((file: string) => file.startsWith(`tiktok_${timestamp}`))

        if (downloadedFiles.length === 0) {
          reject(new Error("TikTok download failed - no file created"))
          return
        }

        const downloadedFile = path.join(tempDir, downloadedFiles[0])
        const fileBuffer = await fs.readFile(downloadedFile)

        await fs.unlink(downloadedFile)
        resolve(fileBuffer)
      } catch (fileError) {
        reject(new Error(`File processing failed: ${fileError}`))
      }
    })

    ytdlProcess.on("error", (error: Error) => {
      reject(new Error(`Failed to start yt-dlp: ${error.message}`))
    })

    setTimeout(() => {
      ytdlProcess.kill()
      reject(new Error("Download timeout"))
    }, 300000)
  })
}
