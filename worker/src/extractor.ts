import { spawn } from "node:child_process";
import { Readable } from "node:stream";
import type { ExtractResult, Format, ExtractItem } from "./types.js";

export class WorkerError extends Error {
  constructor(public code: string, public httpStatus: number, msg?: string) {
    super(msg ?? code);
  }
}

export function spawnArgs(url: string): string[] {
  return [
    "-J",
    "--no-warnings",
    "--no-call-home",
    "--no-playlist",
    "--socket-timeout",
    "20",
    "--retries",
    "2",
    url,
  ];
}

type YtFormat = {
  format_id: string;
  ext: string;
  filesize?: number;
  filesize_approx?: number;
  height?: number;
  vcodec?: string;
  acodec?: string;
  abr?: number;
  url?: string;
  http_headers?: Record<string, string>;
};

type YtJson = {
  id: string;
  title?: string;
  thumbnail?: string;
  duration?: number;
  extractor_key?: string;
  formats?: YtFormat[];
  url?: string;
  ext?: string;
  is_live?: boolean;
  _type?: string;
  entries?: YtJson[];
};

export async function ytdlpExtract(url: string): Promise<ExtractResult> {
  const json = await runYtDlpJson(url);
  return mapResult(url, json);
}

function mapResult(url: string, j: YtJson): ExtractResult {
  const platform = inferPlatform(url, j.extractor_key);
  if (j._type === "playlist" && j.entries?.length) {
    const items: ExtractItem[] = j.entries.map((entry, i) => ({
      id: entry.id ?? `i${i}`,
      type: "video",
      formats: pickFormats(entry),
    }));
    return {
      platform,
      contentType: "playlist",
      title: j.title ?? "Playlist",
      thumbnail: j.thumbnail,
      items,
    };
  }
  return {
    platform,
    contentType: "video",
    title: j.title ?? "Untitled",
    thumbnail: j.thumbnail,
    duration: j.duration,
    items: [
      {
        id: j.id,
        type: "video",
        formats: pickFormats(j),
      },
    ],
  };
}

function pickFormats(j: YtJson): Format[] {
  const list = j.formats ?? [];
  const muxed = list.filter(
    (f) => f.vcodec && f.vcodec !== "none" && f.acodec && f.acodec !== "none",
  );
  const videoOnly = list.filter(
    (f) => f.vcodec && f.vcodec !== "none" && (!f.acodec || f.acodec === "none"),
  );
  const audioOnly = list.filter(
    (f) => (!f.vcodec || f.vcodec === "none") && f.acodec && f.acodec !== "none",
  );

  const out: Format[] = [];
  for (const f of muxed) {
    out.push({
      formatId: f.format_id,
      quality: f.height ? `${f.height}p` : f.ext,
      ext: f.ext,
      sizeBytes: f.filesize ?? f.filesize_approx,
      delivery: "direct",
      directUrl: f.url,
      directHeaders: f.http_headers,
    });
  }
  for (const f of videoOnly) {
    out.push({
      formatId: `${f.format_id}+bestaudio`,
      quality: f.height ? `${f.height}p` : f.ext,
      ext: "mp4",
      sizeBytes: f.filesize ?? f.filesize_approx,
      delivery: "worker-r2",
    });
  }
  for (const f of audioOnly) {
    out.push({
      formatId: f.format_id,
      quality: f.abr ? `${Math.round(f.abr)}kbps` : "audio",
      ext: f.ext,
      sizeBytes: f.filesize ?? f.filesize_approx,
      delivery: "direct",
      directUrl: f.url,
      directHeaders: f.http_headers,
    });
  }
  if (out.length === 0 && j.url) {
    out.push({
      formatId: "best",
      quality: j.ext ?? "best",
      ext: j.ext ?? "bin",
      delivery: "direct",
      directUrl: j.url,
    });
  }
  return out;
}

function inferPlatform(url: string, extractor?: string): ExtractResult["platform"] {
  const ex = (extractor ?? "").toLowerCase();
  if (ex.includes("youtube")) return "youtube";
  if (ex.includes("instagram")) return "instagram";
  if (ex.includes("tiktok")) return "tiktok";
  if (ex.includes("twitter")) return "twitter";
  if (ex.includes("facebook")) return "facebook";
  if (ex.includes("reddit")) return "reddit";
  if (ex.includes("pinterest")) return "pinterest";
  if (ex.includes("vimeo")) return "vimeo";
  if (ex.includes("soundcloud")) return "soundcloud";
  return "generic";
}

function runYtDlpJson(url: string): Promise<YtJson> {
  return new Promise((resolve, reject) => {
    const child = spawn("yt-dlp", spawnArgs(url), { stdio: ["ignore", "pipe", "pipe"] });
    const out: Buffer[] = [];
    const err: Buffer[] = [];
    child.stdout.on("data", (d) => out.push(d));
    child.stderr.on("data", (d) => err.push(d));
    child.on("error", (e) => reject(new WorkerError("degraded", 502, e.message)));
    child.on("close", (code) => {
      const stderr = Buffer.concat(err).toString("utf8");
      if (code !== 0) {
        if (/private|unavailable|removed|not exist/i.test(stderr)) {
          return reject(new WorkerError("unavailable", 404, stderr.slice(0, 200)));
        }
        return reject(new WorkerError("degraded", 502, stderr.slice(0, 200)));
      }
      try {
        resolve(JSON.parse(Buffer.concat(out).toString("utf8")));
      } catch (e) {
        reject(new WorkerError("degraded", 502, "yt-dlp json parse failed"));
      }
    });
  });
}

export type DownloadResult = {
  stream: Readable;
  contentType: string;
  filename: string;
  sizeBytes?: number;
};

export async function runDownload(url: string, formatId: string): Promise<DownloadResult> {
  const args = [
    "-f",
    formatId,
    "-o",
    "-",
    "--no-warnings",
    "--no-call-home",
    "--no-playlist",
    url,
  ];
  const child = spawn("yt-dlp", args, { stdio: ["ignore", "pipe", "pipe"] });
  child.stderr.on("data", (d) => process.stderr.write(d));
  child.on("error", (e) => {
    throw new WorkerError("degraded", 502, e.message);
  });
  return {
    stream: child.stdout,
    contentType: "application/octet-stream",
    filename: `download-${Date.now()}.mp4`,
  };
}
