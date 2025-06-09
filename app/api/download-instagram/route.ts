import { type NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";

// Configuration constants
const CONFIG = {
  TEMP_DIR: path.join(process.cwd(), "temp"),
  MAX_FILE_SIZE: 500 * 1024 * 1024, // 500MB
  DOWNLOAD_TIMEOUT: 300000, // 5 minutes
  YTDLP_CHECK_TIMEOUT: 5000,
  OPTIMAL_FORMAT: "best[ext=mp4]/best", // Optimized format for Instagram
} as const;

// Input validation schema
const downloadRequestSchema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .refine((url) => {
      try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();

        // Check for Instagram domains
        const isInstagram =
          hostname.includes("instagram.com") || hostname.includes("instagr.am");
        if (!isInstagram) return false;

        // Check for valid Instagram URL patterns
        const path = urlObj.pathname;
        const validPatterns = [
          /^\/p\/[A-Za-z0-9_-]+/, // Posts
          /^\/reel\/[A-Za-z0-9_-]+/, // Reels
          /^\/stories\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+/, // Stories
          /^\/tv\/[A-Za-z0-9_-]+/, // IGTV
        ];

        return validPatterns.some((pattern) => pattern.test(path));
      } catch {
        return false;
      }
    }, "Please provide a valid Instagram URL (post, reel, story, or IGTV)"),
});

// Add these functions before the POST handler

function isValidInstagramUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const validDomains = [
      "instagram.com",
      "www.instagram.com",
      "instagr.am",
      "www.instagr.am",
    ];

    if (!validDomains.includes(urlObj.hostname)) {
      return false;
    }

    // Check for valid Instagram post/reel/story patterns
    const path = urlObj.pathname;
    const validPatterns = [
      /^\/p\/[\w-]+/i, // Posts
      /^\/reel\/[\w-]+/i, // Reels
      /^\/stories\/[\w-]+\/\d+/i, // Stories
    ];

    return validPatterns.some((pattern) => pattern.test(path));
  } catch {
    return false;
  }
}

async function validateEnvironment(): Promise<void> {
  const ytdlpAvailable = await checkYtDlpAvailable();
  if (!ytdlpAvailable) {
    throw new Error("yt-dlp is not installed or not accessible");
  }
}

function buildYtDlpArgs(
  url: string,
  format: string,
  quality: string,
  outputTemplate: string
): string[] {
  return [
    "--no-warnings",
    "--no-playlist",
    "--max-filesize",
    "500M",
    "-o",
    outputTemplate,
    "-f",
    format,
    "--merge-output-format",
    "mp4",
    "--prefer-ffmpeg",
    "--postprocessor-args",
    "-c:v libx264 -c:a aac -b:a 192k -preset ultrafast",
    url,
  ];
}

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

    const { url } = validatedData;
    console.log("Validated data:", { url });

    // Enhanced URL validation for Instagram specifically
    if (!isValidInstagramUrl(url)) {
      return NextResponse.json(
        {
          error: "Invalid Instagram URL format",
          code: "INVALID_INSTAGRAM_URL",
        },
        { status: 400 }
      );
    }

    // Environment checks
    await validateEnvironment();

    // Setup temp directory
    await setupTempDirectory();

    try {
      const videoInfo = await getVideoInfo(url);
      const safeTitle = sanitizeFilename(videoInfo.title);
      const finalFilename = `Instagram_${safeTitle}.mp4`;

      // Generate a unique base name for the temporary file
      const uniqueBaseName = `${Date.now()}_ig_temp`;
      const outputTemplate = path.join(
        CONFIG.TEMP_DIR,
        `${uniqueBaseName}.%(ext)s`
      );

      console.log(`[Instagram Route] Using outputTemplate: ${outputTemplate}`);

      const fileBuffer = await downloadWithYtDlp(
        url,
        "bestvideo[ext=mp4][vcodec^=avc1]+bestaudio[ext=m4a][acodec^=mp4a]/best[ext=mp4]/best",
        "720p",
        outputTemplate,
        Date.now(),
        (progress) => {
          // Progress is logged but not streamed to client in this model
          console.log(`[Instagram Route] Download progress: ${progress}%`);
        }
      );

      console.log(
        `[Instagram Route] Contents of TEMP_DIR (${CONFIG.TEMP_DIR}):`
      );
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
      console.error("Instagram download error:", e);
      return NextResponse.json(
        { error: (e as Error).message || "Internal server error" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Instagram API error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      requestBody,
    });

    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      {
        error: errorMessage,
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

async function checkYtDlpAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const process = spawn("yt-dlp", ["--version"], {
      stdio: "pipe",
      timeout: CONFIG.YTDLP_CHECK_TIMEOUT,
    });

    let resolved = false;

    process.on("close", (code: number) => {
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

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        process.kill();
        resolve(false);
      }
    }, CONFIG.YTDLP_CHECK_TIMEOUT);
  });
}

async function setupTempDirectory(): Promise<void> {
  try {
    await fs.access(CONFIG.TEMP_DIR);
  } catch {
    await fs.mkdir(CONFIG.TEMP_DIR, { recursive: true, mode: 0o755 });
  }
}

async function downloadWithYtDlp(
  url: string,
  format: string,
  quality: string,
  outputTemplate: string,
  timestamp: number,
  onProgress: (progress: number) => void
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const ytdlArgs = [
      "--no-warnings",
      "--no-playlist",
      "--max-filesize",
      "500M",
      "-o",
      outputTemplate,
      "-f",
      "bestvideo[ext=mp4][vcodec^=avc1]+bestaudio[ext=m4a][acodec^=mp4a]/best[ext=mp4]/best",
      "--merge-output-format",
      "mp4",
      "--prefer-ffmpeg",
      "--postprocessor-args",
      "-c:v libx264 -c:a aac -b:a 192k -preset ultrafast -movflags +faststart",
      url,
    ];

    console.log("Executing yt-dlp:", {
      url,
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
    let downloadProgress = 0;

    ytdlProcess.stdout?.on("data", (data: Buffer) => {
      const output = data.toString();
      stdout += output;

      // Parse progress from output
      const progressMatch = output.match(/\[download\]\s+(\d+\.?\d*)%/);
      if (progressMatch) {
        downloadProgress = parseFloat(progressMatch[1]);
        onProgress(downloadProgress);
      }
    });

    ytdlProcess.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    ytdlProcess.on("close", async (code: number) => {
      if (code !== 0) {
        console.error("yt-dlp failed:", { code, stderr });
        const errorMessage = stderr.includes("command not found")
          ? "yt-dlp not found. Please ensure it's installed and in your PATH."
          : stderr || `Download failed with exit code ${code}`;
        reject(new Error(errorMessage));
        return;
      }

      try {
        const files = await fs.readdir(CONFIG.TEMP_DIR);
        const baseFileName = path.basename(outputTemplate).split(".")[0]; // Get the base name before %(ext)s
        const fname = files.find(
          (f) =>
            f.startsWith(baseFileName) &&
            f.endsWith(format === "audio" ? ".mp3" : ".mp4")
        );

        if (!fname)
          return reject(new Error("No output file found after download."));

        const downloadedFile = path.join(CONFIG.TEMP_DIR, fname);
        const fileBuffer = await fs.readFile(downloadedFile);
        // await fs.unlink(downloadedFile).catch(console.error); // Comment out to keep file for debugging
        resolve(fileBuffer);
      } catch (fileError) {
        console.error("Error processing downloaded file:", fileError);
        reject(
          new Error(`File processing failed: ${(fileError as Error).message}`)
        );
      }
    });

    ytdlProcess.on("error", (error: Error) => {
      console.error("Failed to spawn yt-dlp:", error);
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        reject(
          new Error(
            "yt-dlp command not found. Please ensure yt-dlp is installed and accessible in your system's PATH."
          )
        );
      } else {
        reject(new Error(`Failed to execute yt-dlp: ${error.message}`));
      }
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

async function processDownloadedFile(timestamp: number): Promise<Buffer> {
  const files = await fs.readdir(CONFIG.TEMP_DIR);
  const downloadedFiles = files.filter((file: string) =>
    file.startsWith(`instagram_${timestamp}`)
  );

  if (downloadedFiles.length === 0) {
    throw new Error("No downloaded file found");
  }

  const downloadedFile = path.join(CONFIG.TEMP_DIR, downloadedFiles[0]);

  try {
    const fileBuffer = await fs.readFile(downloadedFile);
    // await fs.unlink(downloadedFile).catch(console.error); // Comment out to keep file for debugging
    return fileBuffer;
  } catch (error) {
    // await fs.unlink(downloadedFile).catch(console.error); // Comment out to keep file for debugging
    throw error;
  }
}

function getErrorMessage(stderr: string, code: number): string {
  if (stderr.includes("Video unavailable")) {
    return "Instagram content is unavailable or private";
  }
  if (stderr.includes("Sign in to confirm")) {
    return "Content requires age verification";
  }
  if (stderr.includes("Private video")) {
    return "Content is private";
  }
  if (stderr.includes("blocked")) {
    return "Content is blocked in your region";
  }
  if (stderr.includes("Login required")) {
    return "Content requires Instagram login";
  }
  if (stderr.includes("Requested format is not available")) {
    return "The requested format is not available for this content";
  }

  return `Download failed with code ${code}`;
}

// Cleanup function for graceful shutdown
export async function cleanup() {
  try {
    const files = await fs.readdir(CONFIG.TEMP_DIR);
    const tempFiles = files.filter(
      (file) =>
        file.includes("instagram_") &&
        (file.endsWith(".mp4") || file.endsWith(".mp3"))
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

// Add these new functions
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
        resolve({ title: info.title || "Instagram Video" });
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

function getFormatSelector(q: string) {
  const map: Record<string, string> = {
    "1080p":
      "bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4]",
    "720p": "bestvideo[ext=mp4][height<=720]+bestaudio[ext=m4a]/best[ext=mp4]",
    "480p": "bestvideo[ext=mp4][height<=480]+bestaudio[ext=m4a]/best[ext=mp4]",
    "360p": "bestvideo[ext=mp4][height<=360]+bestaudio[ext=m4a]/best[ext=mp4]",
  };
  return map[q] || "best[ext=mp4]";
}

function getFileMetadata(format: string, quality: string, id: string) {
  const t = Date.now();
  if (format === "audio") {
    return { mime: "audio/mpeg", filename: `audio_${id}_${quality}_${t}.mp3` };
  }
  return {
    mime: "video/mp4",
    filename: `Instagram_video_${id}_${quality}_${t}.mp4`,
  };
}
