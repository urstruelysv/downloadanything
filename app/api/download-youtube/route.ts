import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { YouTubeService } from "@/lib/services/youtube-service";

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

  try {
    const videoInfo = await YouTubeService.getVideoInfo(data.url);
    const format = data.format === "audio" ? "mp3" : "mp4";

    // Get the appropriate format URL
    const formatUrl = videoInfo.formats.find(
      (f) =>
        f.mimeType.includes(format) &&
        (data.format === "audio" ? f.hasAudio : f.hasVideo)
    )?.url;

    if (!formatUrl) {
      throw new Error(`No ${format} format available`);
    }

    // Download the video/audio
    const response = await fetch(formatUrl);
    if (!response.ok) {
      throw new Error("Download failed");
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": format === "mp3" ? "audio/mpeg" : "video/mp4",
        "Content-Disposition": `attachment; filename="video.${format}"`,
        "Content-Length": buffer.length.toString(),
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
