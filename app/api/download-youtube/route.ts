import { type NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";

// Custom URL validation function
function isValidUrl(urlString: string): boolean {
  try {
    // Add protocol if missing
    if (!urlString.startsWith("http://") && !urlString.startsWith("https://")) {
      urlString = "https://" + urlString;
    }

    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();

    // Check if it's a supported domain
    const supportedDomains = [
      "youtube.com",
      "youtu.be",
      "m.youtube.com",
      "www.youtube.com",
      "youtube.com",
      "instagram.com",
      "instagr.am",
      "tiktok.com",
      "vm.tiktok.com",
      "facebook.com",
      "fb.watch",
      "m.facebook.com",
      "twitter.com",
      "x.com",
      "t.co",
      "vimeo.com",
    ];

    const isSupported = supportedDomains.some(
      (domain) => hostname === domain || hostname.endsWith("." + domain)
    );

    if (!isSupported) {
      return false;
    }

    // For YouTube URLs, ensure we can extract a valid video ID
    if (hostname.includes("youtube") || hostname.includes("youtu.be")) {
      return extractVideoId(urlString) !== null;
    }

    return true;
  } catch {
    return false;
  }
}

// Improved input validation schema
const downloadRequestSchema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .refine(isValidUrl, {
      message: "Please provide a valid URL from a supported platform",
    })
    .transform((url) => {
      // Ensure URL has protocol
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return "https://" + url;
      }
      return url;
    }),
  format: z
    .enum(["audio", "video"], {
      message: "Format must be 'audio' or 'video'",
    })
    .default("video"),
  quality: z
    .enum(["320kbps", "128kbps", "1080p", "720p", "480p", "360p"], {
      message: "Invalid quality option",
    })
    .default("720p"),
});

// Configuration constants
const CONFIG = {
  TEMP_DIR: path.join(process.cwd(), "temp"),
  MAX_FILE_SIZE: 500 * 1024 * 1024, // 500MB
  DOWNLOAD_TIMEOUT: 300000, // 5 minutes
  YTDLP_CHECK_TIMEOUT: 5000,
  SUPPORTED_DOMAINS: ["youtube.com", "youtu.be", "m.youtube.com"],
  MAX_CONCURRENT_DOWNLOADS: 3,
} as const;

// Active download tracking
const activeDownloads = new Set<string>();

export async function POST(request: NextRequest) {
  let requestBody: any;

  try {
    // Parse request body with better error handling
    try {
      requestBody = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        {
          error: "Invalid JSON in request body",
          code: "INVALID_JSON",
          details: "Please ensure your request contains valid JSON",
        },
        { status: 400 }
      );
    }

    // Log the request for debugging
    console.log("Received request:", requestBody);

    // Validate input with detailed error handling
    let validatedData;
    try {
      validatedData = downloadRequestSchema.parse(requestBody);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.log("Validation errors:", validationError.errors);
        return NextResponse.json(
          {
            error: "Invalid request parameters",
            code: "VALIDATION_ERROR",
            details: validationError.errors.map((err) => ({
              field: err.path.join("."),
              message: err.message,
              received:
                err.code === "invalid_type"
                  ? typeof requestBody[err.path[0]]
                  : requestBody[err.path[0]],
            })),
          },
          { status: 400 }
        );
      }
      throw validationError;
    }

    const { url, format, quality } = validatedData;
    console.log("Validated data:", { url, format, quality });

    // Enhanced URL validation for YouTube specifically
    const videoId = extractVideoId(url);
    if (!videoId && url.includes("youtube")) {
      return NextResponse.json(
        { error: "Invalid YouTube URL format", code: "INVALID_YOUTUBE_URL" },
        { status: 400 }
      );
    }

    // Generate a unique key for this download
    const downloadKey = videoId
      ? `${videoId}_${format}_${quality}`
      : `${Buffer.from(url)
          .toString("base64")
          .substring(0, 10)}_${format}_${quality}`;

    // Check for duplicate downloads
    if (activeDownloads.has(downloadKey)) {
      return NextResponse.json(
        { error: "Download already in progress", code: "DUPLICATE_REQUEST" },
        { status: 429 }
      );
    }

    // Check concurrent download limit
    if (activeDownloads.size >= CONFIG.MAX_CONCURRENT_DOWNLOADS) {
      return NextResponse.json(
        { error: "Server busy, please try again later", code: "SERVER_BUSY" },
        { status: 503 }
      );
    }

    activeDownloads.add(downloadKey);

    try {
      // Environment checks
      await validateEnvironment();

      // Setup temp directory with proper permissions
      await setupTempDirectory();

      const timestamp = Date.now();
      const outputTemplate = path.join(
        CONFIG.TEMP_DIR,
        `${downloadKey}_${timestamp}.%(ext)s`
      );

      const fileBuffer = await downloadWithYtDlp(
        url,
        format,
        quality,
        outputTemplate,
        downloadKey,
        timestamp
      );

      // Validate file size
      if (fileBuffer.length > CONFIG.MAX_FILE_SIZE) {
        throw new Error("File size exceeds maximum limit");
      }

      // Return file with proper headers
      const { mimeType, extension, filename } = getFileMetadata(
        format,
        quality,
        videoId || "download"
      );

      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": fileBuffer.length.toString(),
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-Download-Time": Date.now().toString(),
        },
      });
    } finally {
      // Always cleanup tracking
      activeDownloads.delete(downloadKey);
    }
  } catch (error) {
    console.error("API error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      requestBody,
      timestamp: new Date().toISOString(),
    });

    // Don't expose internal errors to users
    const errorMessage =
      error instanceof Error
        ? error.message.includes("yt-dlp")
          ? "Download service temporarily unavailable"
          : error.message
        : "Internal server error";

    return NextResponse.json(
      {
        error: errorMessage,
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

async function validateEnvironment(): Promise<void> {
  const ytdlpAvailable = await checkYtDlpAvailable();
  if (!ytdlpAvailable) {
    throw new Error("yt-dlp is not installed or not accessible");
  }
}

async function setupTempDirectory(): Promise<void> {
  try {
    await fs.access(CONFIG.TEMP_DIR);
  } catch {
    await fs.mkdir(CONFIG.TEMP_DIR, { recursive: true, mode: 0o755 });
  }
}

async function checkYtDlpAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const process = spawn("yt-dlp", ["--version"], {
      stdio: "pipe",
      timeout: CONFIG.YTDLP_CHECK_TIMEOUT,
    });

    let resolved = false;

    process.on("close", (code) => {
      if (!resolved) {
        resolved = true;
        resolve(code === 0);
      }
    });

    process.on("error", () => {
      if (!resolved) {
        resolved = true;
        resolve(false);
      }
    });

    // Backup timeout
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        process.kill();
        resolve(false);
      }
    }, CONFIG.YTDLP_CHECK_TIMEOUT);
  });
}

async function downloadWithYtDlp(
  url: string,
  format: string,
  quality: string,
  outputTemplate: string,
  downloadKey: string,
  timestamp: number
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const ytdlArgs = buildYtDlpArgs(url, format, quality, outputTemplate);

    console.log("Executing yt-dlp:", {
      downloadKey,
      format,
      quality,
      timestamp,
      args: ytdlArgs,
    });

    const ytdlProcess = spawn("yt-dlp", ytdlArgs, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    ytdlProcess.stdout?.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    ytdlProcess.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    ytdlProcess.on("close", async (code: number) => {
      if (code !== 0) {
        console.error("yt-dlp failed:", { code, stderr, downloadKey });
        reject(new Error(`Download failed: ${getErrorMessage(stderr, code)}`));
        return;
      }

      try {
        const fileBuffer = await processDownloadedFile(downloadKey, timestamp);
        resolve(fileBuffer);
      } catch (fileError) {
        reject(new Error(`File processing failed: ${fileError}`));
      }
    });

    ytdlProcess.on("error", (error: Error) => {
      reject(new Error(`Failed to start yt-dlp: ${error.message}`));
    });

    // Timeout handling
    const timeoutId = setTimeout(() => {
      ytdlProcess.kill("SIGTERM");
      reject(new Error("Download timeout - process took too long"));
    }, CONFIG.DOWNLOAD_TIMEOUT);

    ytdlProcess.on("close", () => {
      clearTimeout(timeoutId);
    });
  });
}

function buildYtDlpArgs(
  url: string,
  format: string,
  quality: string,
  outputTemplate: string
): string[] {
  const baseArgs = [
    "--no-warnings",
    "--no-playlist",
    "--max-filesize",
    "500M",
    "-o",
    outputTemplate,
  ];

  if (format === "audio") {
    return [
      ...baseArgs,
      "-x",
      "--audio-format",
      "mp3",
      "--audio-quality",
      quality === "320kbps" ? "0" : "5",
      "--embed-metadata",
      url,
    ];
  } else {
    const formatSelector = getFormatSelector(quality);
    return [
      ...baseArgs,
      "-f",
      formatSelector,
      "--merge-output-format",
      "mp4",
      url,
    ];
  }
}

async function processDownloadedFile(
  downloadKey: string,
  timestamp: number
): Promise<Buffer> {
  const files = await fs.readdir(CONFIG.TEMP_DIR);
  const downloadedFiles = files.filter((file: string) =>
    file.startsWith(`${downloadKey}_${timestamp}`)
  );

  if (downloadedFiles.length === 0) {
    throw new Error("No downloaded file found");
  }

  const downloadedFile = path.join(CONFIG.TEMP_DIR, downloadedFiles[0]);

  try {
    const fileBuffer = await fs.readFile(downloadedFile);

    // Clean up immediately after reading
    await fs.unlink(downloadedFile).catch(console.error);

    return fileBuffer;
  } catch (error) {
    // Ensure cleanup even if reading fails
    await fs.unlink(downloadedFile).catch(console.error);
    throw error;
  }
}

function extractVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Check if domain is supported
    const isSupported = CONFIG.SUPPORTED_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    );

    if (!isSupported) {
      return null;
    }

    // Handle various YouTube URL formats
    const patterns = [
      // Standard watch URLs
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      // Short URLs
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      // Embed URLs
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      // Watch URLs with additional parameters
      /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
      // Mobile URLs
      /m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      // URLs with additional parameters
      /youtube\.com\/watch\?.*&v=([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1] && match[1].length === 11) {
        return match[1];
      }
    }

    // If no pattern matches, try to extract from query parameters
    const searchParams = new URLSearchParams(urlObj.search);
    const videoId = searchParams.get("v");
    if (videoId && videoId.length === 11) {
      return videoId;
    }

    return null;
  } catch (error) {
    console.error("URL parsing error:", error);
    return null;
  }
}

function getFormatSelector(quality: string): string {
  const formatMap = {
    "1080p":
      "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]",
    "720p":
      "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]",
    "480p":
      "bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480][ext=mp4]",
    "360p":
      "bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/best[height<=360][ext=mp4]",
  };

  return formatMap[quality as keyof typeof formatMap] || "best[ext=mp4]";
}

function getFileMetadata(format: string, quality: string, videoId: string) {
  const timestamp = Date.now();

  if (format === "audio") {
    return {
      mimeType: "audio/mpeg",
      extension: "mp3",
      filename: `audio_${videoId}_${quality}_${timestamp}.mp3`,
    };
  } else {
    return {
      mimeType: "video/mp4",
      extension: "mp4",
      filename: `video_${videoId}_${quality}_${timestamp}.mp4`,
    };
  }
}

function getErrorMessage(stderr: string, code: number): string {
  if (stderr.includes("Video unavailable")) {
    return "Video is unavailable or private";
  }
  if (stderr.includes("Sign in to confirm")) {
    return "Video requires age verification";
  }
  if (stderr.includes("Private video")) {
    return "Video is private";
  }
  if (stderr.includes("blocked")) {
    return "Video is blocked in your region";
  }

  return `Download failed with code ${code}`;
}

// Cleanup function for graceful shutdown
export async function cleanup() {
  try {
    const files = await fs.readdir(CONFIG.TEMP_DIR);
    const tempFiles = files.filter(
      (file) =>
        file.includes("_") && (file.endsWith(".mp4") || file.endsWith(".mp3"))
    );

    await Promise.all(
      tempFiles.map((file) =>
        fs.unlink(path.join(CONFIG.TEMP_DIR, file)).catch(console.error)
      )
    );
  } catch (error) {
    console.error("Cleanup failed:", error);
  }
}
