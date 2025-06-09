import { type NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Use yt-dlp to get video information
    const info = await getVideoInfo(url);
    return NextResponse.json(info);
  } catch (error) {
    console.error("Error fetching video info:", error);
    return NextResponse.json(
      { error: "Failed to fetch video information" },
      { status: 500 }
    );
  }
}

function getVideoInfo(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const ytdlProcess = spawn("yt-dlp", ["--dump-json", "--no-playlist", url]);

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
        resolve({
          title: info.title,
          thumbnail: info.thumbnail,
          duration: info.duration,
          uploader: info.uploader,
          viewCount: info.view_count,
          uploadDate: info.upload_date,
        });
      } catch (error) {
        reject(new Error("Failed to parse video information"));
      }
    });

    ytdlProcess.on("error", (error: Error) => {
      reject(new Error(`Failed to start yt-dlp: ${error.message}`));
    });
  });
}
