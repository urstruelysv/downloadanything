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

  const videoId = extractVideoId(data.url)!;
  const meta = getFileMetadata(data.format, data.quality, videoId);
  const outputTemplate = path.join(CONFIG.TEMP_DIR, `${videoId}-%(ext)s`);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(ctrl) {
      try {
        const buffer = await runYtDlp(
          data.url,
          data.format,
          data.quality,
          outputTemplate,
          (progress) => {
            ctrl.enqueue(encoder.encode(JSON.stringify({ progress }) + "\n"));
          }
        );
        ctrl.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "complete",
              filename: meta.filename,
              title: meta.filename,
            }) + "\n"
          )
        );
        ctrl.enqueue(buffer);
        ctrl.close();
      } catch (e) {
        ctrl.error(e);
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Transfer-Encoding": "chunked",
    },
  });
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
      : ["-f", getFormatSelector(quality)];
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
      if (code !== 0) return reject(new Error(stderr || `code ${code}`));
      // read back the file we just wrote
      const files = await fs.readdir(CONFIG.TEMP_DIR);
      const fname = files.find(
        (f) =>
          f.startsWith(url.split("v=")[1] || "") ||
          f.endsWith(format === "audio" ? ".mp3" : ".mp4")
      );
      if (!fname) return reject(new Error("No output file"));
      const buf = await fs.readFile(path.join(CONFIG.TEMP_DIR, fname));
      await fs.unlink(path.join(CONFIG.TEMP_DIR, fname));
      resolve(buf);
    });
  });
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

function getFormatSelector(q: string) {
  const map: Record<string, string> = {
    "1080p": "bestvideo[height<=1080]+bestaudio/best",
    "720p": "bestvideo[height<=720]+bestaudio/best",
    "480p": "bestvideo[height<=480]+bestaudio/best",
    "360p": "bestvideo[height<=360]+bestaudio/best",
  };
  return map[q] || "best";
}

function getFileMetadata(format: string, quality: string, id: string) {
  const t = Date.now();
  if (format === "audio") {
    return { mime: "audio/mpeg", filename: `audio_${id}_${quality}_${t}.mp3` };
  }
  return { mime: "video/mp4", filename: `video_${id}_${quality}_${t}.mp4` };
}
