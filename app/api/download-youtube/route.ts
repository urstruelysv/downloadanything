import { type NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";

// Only YouTube domains
const YT_DOMAINS = [
  "youtube.com",
  "youtu.be",
  "m.youtube.com",
  "www.youtube.com",
];

// Validate that URL is YouTube and has a real video ID
function isYouTubeUrl(urlString: string): boolean {
  try {
    if (!urlString.startsWith("http://") && !urlString.startsWith("https://")) {
      urlString = "https://" + urlString;
    }
    const url = new URL(urlString);
    const h = url.hostname.toLowerCase();
    const domainOk = YT_DOMAINS.some((d) => h === d || h.endsWith(`.${d}`));
    if (!domainOk) return false;
    // must extract 11-char ID
    return extractVideoId(urlString) !== null;
  } catch {
    return false;
  }
}

const downloadRequestSchema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .refine(isYouTubeUrl, { message: "Please provide a valid YouTube URL" })
    .transform((u) => (u.startsWith("http") ? u : "https://" + u)),
  format: z.enum(["audio", "video"]).default("video"),
  quality: z
    .enum(["320kbps", "128kbps", "1080p", "720p", "480p", "360p"])
    .default("720p"),
});

const CONFIG = {
  TEMP_DIR: path.join(process.cwd(), "temp"),
  MAX_FILE_SIZE: 500 * 1024 * 1024,
  DOWNLOAD_TIMEOUT: 300_000,
  YTDLP_CHECK_TIMEOUT: 5_000,
} as const;

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let data;
  try {
    data = downloadRequestSchema.parse(body);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.errors },
        { status: 400 }
      );
    }
    throw err;
  }

  await ensureYtDlp();
  await fs.mkdir(CONFIG.TEMP_DIR, { recursive: true });

  try {
    const videoInfo = await getVideoInfo(data.url);
    const safeTitle = sanitizeFilename(videoInfo.title);
    const finalFilename = `YouTube_${safeTitle}.mp4`;

    // Generate a unique base name for the temporary file
    const uniqueBaseName = `${Date.now()}_yt_temp`;
    const outputTemplate = path.join(
      CONFIG.TEMP_DIR,
      `${uniqueBaseName}.%(ext)s`
    );

    console.log(`[YouTube Route] Using outputTemplate: ${outputTemplate}`);

    const fileBuffer = await runYtDlp(
      data.url,
      data.format,
      data.quality,
      outputTemplate,
      (progress) => {
        // Progress is logged but not streamed to client in this model
        console.log(`[YouTube Route] Download progress: ${progress}%`);
      }
    );

    console.log(`[YouTube Route] Contents of TEMP_DIR (${CONFIG.TEMP_DIR}):`);
    const tempDirContents = await fs.readdir(CONFIG.TEMP_DIR);
    console.log(tempDirContents);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${finalFilename}"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (e) {
    console.error("YouTube download error:", e);
    return NextResponse.json(
      { error: (e as Error).message || "Internal server error" },
      { status: 500 }
    );
  }
}

async function ensureYtDlp() {
  return new Promise<void>((res, rej) => {
    const p = spawn("yt-dlp", ["--version"], {
      timeout: CONFIG.YTDLP_CHECK_TIMEOUT,
    });
    p.on("close", (code) =>
      code === 0 ? res() : rej(new Error("yt-dlp missing"))
    );
    p.on("error", () => rej(new Error("yt-dlp error")));
  });
}

function runYtDlp(
  url: string,
  format: "audio" | "video",
  quality: string,
  out: string,
  onProgress: (p: number) => void
): Promise<Buffer> {
  const args =
    format === "audio"
      ? [
          "-x",
          "--audio-format",
          "mp3",
          "--audio-quality",
          quality === "320kbps" ? "0" : "5",
        ]
      : [
          "-f",
          "bestvideo[ext=mp4][vcodec^=avc1]+bestaudio[ext=m4a][acodec^=mp4a]/best[ext=mp4]/best", // Prioritize H.264 MP4 video and AAC M4A audio, then generic best MP4, then general best
          "--merge-output-format",
          "mp4",
          "--prefer-ffmpeg",
          "--postprocessor-args",
          "-c:v libx264 -c:a aac -b:a 192k -preset ultrafast -movflags +faststart",
        ];
  args.unshift(
    "--no-warnings",
    "--no-playlist",
    "--max-filesize",
    "500M",
    "-o",
    out,
    url
  );

  return new Promise((resolve, reject) => {
    const proc = spawn("yt-dlp", args);
    let stderr = "";
    proc.stdout?.on("data", (d) => {
      const m = d.toString().match(/\[download\]\s+(\d+\.\d+)%/);
      if (m) onProgress(parseFloat(m[1]));
    });
    proc.stderr?.on("data", (d) => (stderr += d.toString()));
    proc.on("close", async (code) => {
      if (code !== 0) {
        console.error("yt-dlp process failed:", { code, stderr });
        const errorMessage = stderr.includes("command not found")
          ? "yt-dlp not found. Please ensure it's installed and in your PATH."
          : stderr || `Download failed with exit code ${code}`;
        return reject(new Error(errorMessage));
      }
      // read back the file we just wrote
      const files = await fs.readdir(CONFIG.TEMP_DIR);
      const baseFileName = path.basename(out).split(".%")[0]; // Get the base name before %(ext)s
      const fname = files.find(
        (f) =>
          f.startsWith(baseFileName) &&
          f.endsWith(format === "audio" ? ".mp3" : ".mp4")
      );

      if (!fname)
        return reject(new Error("No output file found after download."));

      const downloadedFile = path.join(CONFIG.TEMP_DIR, fname);
      try {
        const buf = await fs.readFile(downloadedFile);
        // await fs.unlink(downloadedFile); // COMMENTED OUT: KEEP FILE FOR DEBUGGING
        resolve(buf);
      } catch (fileReadError) {
        console.error(
          "Error reading or deleting temporary file:",
          fileReadError
        );
        // await fs.unlink(downloadedFile).catch(() => {}); // COMMENTED OUT: KEEP FILE FOR DEBUGGING
        reject(
          new Error(
            `Failed to read or clean up downloaded file: ${
              (fileReadError as Error).message
            }`
          )
        );
      }
    });
    proc.on("error", (err) => {
      console.error("Failed to spawn yt-dlp:", err);
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        reject(
          new Error(
            "yt-dlp command not found. Please ensure yt-dlp is installed and accessible in your system's PATH."
          )
        );
      } else {
        reject(new Error(`Failed to execute yt-dlp: ${err.message}`));
      }
    });
  });
}

async function getVideoInfo(url: string): Promise<{ title: string }> {
  return new Promise((resolve, reject) => {
    const ytdlProcess = spawn("yt-dlp", [
      "--no-warnings",
      "--dump-json",
      "--no-playlist",
      url,
    ]);

    let stdout = "";
    let stderr = "";

    ytdlProcess.stdout?.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    ytdlProcess.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    ytdlProcess.on("close", (code: number) => {
      if (code !== 0) {
        reject(new Error(`Failed to get video info: ${stderr}`));
        return;
      }

      try {
        const info = JSON.parse(stdout);
        resolve({ title: info.title });
      } catch (error) {
        reject(new Error("Failed to parse video info"));
      }
    });
  });
}

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, "_") // Replace invalid characters
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .substring(0, 100); // Limit length
}

function extractVideoId(u: string): string | null {
  try {
    const m =
      u.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/) ||
      new URL(u).searchParams.get("v")?.match(/^([A-Za-z0-9_-]{11})$/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}
