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

export async function POST(request: NextRequest) {
  let requestBody: any;

  try {
    // Parse request body
    try {
      requestBody = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        {
          error: "Invalid JSON in request body",
          code: "INVALID_JSON",
        },
        { status: 400 }
      );
    }

    // Validate input
    let validatedData;
    try {
      validatedData = downloadRequestSchema.parse(requestBody);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Invalid request parameters",
            code: "VALIDATION_ERROR",
            details: validationError.errors,
          },
          { status: 400 }
        );
      }
      throw validationError;
    }

    const { url } = validatedData;

    // Environment checks
    const ytdlpAvailable = await checkYtDlpAvailable();
    if (!ytdlpAvailable) {
      return NextResponse.json(
        {
          error: "yt-dlp is not installed or not accessible",
          code: "YTDLP_NOT_FOUND",
        },
        { status: 500 }
      );
    }

    // Setup temp directory
    await setupTempDirectory();

    const timestamp = Date.now();
    const outputTemplate = path.join(
      CONFIG.TEMP_DIR,
      `instagram_${timestamp}.%(ext)s`
    );

    // Create a response stream for real-time progress
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const fileBuffer = await downloadWithYtDlp(
            url,
            outputTemplate,
            timestamp,
            (progress) => {
              // Send progress updates
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({ type: "progress", progress }) + "\n"
                )
              );
            }
          );

          // Send the final file
          controller.enqueue(
            encoder.encode(JSON.stringify({ type: "complete" }) + "\n")
          );
          controller.enqueue(fileBuffer);
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Transfer-Encoding": "chunked",
      },
    });
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
      CONFIG.OPTIMAL_FORMAT,
      "--merge-output-format",
      "mp4",
      "--prefer-ffmpeg",
      "--postprocessor-args",
      "-c:v libx264 -c:a aac -b:a 192k -preset ultrafast",
      url,
    ];

    console.log("Executing Instagram download:", {
      url,
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
        reject(new Error(`Download failed: ${getErrorMessage(stderr, code)}`));
        return;
      }

      try {
        const fileBuffer = await processDownloadedFile(timestamp);
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
    await fs.unlink(downloadedFile).catch(console.error);
    return fileBuffer;
  } catch (error) {
    await fs.unlink(downloadedFile).catch(console.error);
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
