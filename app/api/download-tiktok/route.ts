import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs"
import path from "path"

const execAsync = promisify(exec)

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

    // Create temporary directory
    const tempDir = path.join(process.cwd(), "temp")
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const outputPath = path.join(tempDir, `tiktok_${Date.now()}`)

    try {
      let command: string

      if (format === "audio") {
        // Download audio only
        command = `yt-dlp -x --audio-format mp3 -o "${outputPath}.%(ext)s" "${url}"`
      } else {
        // Download video (TikTok usually has one quality)
        command = `yt-dlp -f "best" -o "${outputPath}.%(ext)s" "${url}"`
      }

      console.log("Executing TikTok download:", command)
      const { stdout, stderr } = await execAsync(command)

      if (stderr && !stderr.includes("WARNING")) {
        throw new Error(stderr)
      }

      // Find the downloaded file
      const files = fs.readdirSync(tempDir).filter((file) => file.startsWith(path.basename(outputPath)))

      if (files.length === 0) {
        throw new Error("TikTok download failed - no file created")
      }

      const downloadedFile = path.join(tempDir, files[0])
      const fileBuffer = fs.readFileSync(downloadedFile)

      // Clean up
      fs.unlinkSync(downloadedFile)

      // Return file
      const mimeType = format === "audio" ? "audio/mpeg" : "video/mp4"
      const filename = `tiktok_${quality}.${format === "audio" ? "mp3" : "mp4"}`

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
          error: "TikTok download failed. The content might be private or unavailable.",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("TikTok API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
