import { spawn } from "node:child_process";
import { Readable } from "node:stream";
import type { ExtractResult, Format, ExtractItem } from "./types.js";
import { ExtractError } from "./shared-errors.js";

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

const EXTRACTOR_TO_PLATFORM: Record<string, ExtractResult["platform"]> = {
  youtube: "youtube",
  instagram: "instagram",
  tiktok: "tiktok",
  twitter: "twitter",
  facebook: "facebook",
  reddit: "reddit",
  pinterest: "pinterest",
  vimeo: "vimeo",
  soundcloud: "soundcloud",
};

function platformFromExtractor(key?: string): ExtractResult["platform"] {
  if (!key) return "generic";
  const lower = key.toLowerCase();
  for (const [match, platform] of Object.entries(EXTRACTOR_TO_PLATFORM)) {
    if (lower.includes(match)) return platform;
  }
  return "generic";
}

export async function ytdlpExtract(url: string): Promise<ExtractResult> {
  const json = await runYtDlpJson(url);
  return mapResult(json);
}

function mapResult(j: YtJson): ExtractResult {
  const platform = platformFromExtractor(j.extractor_key);

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
    items: [{ id: j.id, type: "video", formats: pickFormats(j) }],
  };
}

function pickFormats(j: YtJson): Format[] {
  const list = j.formats ?? [];
  const out: Format[] = [];

  const muxed = list.filter(
    (f) => f.vcodec && f.vcodec !== "none" && f.acodec && f.acodec !== "none",
  );
  const videoOnly = list.filter(
    (f) => f.vcodec && f.vcodec !== "none" && (!f.acodec || f.acodec === "none"),
  );
  const audioOnly = list.filter(
    (f) => (!f.vcodec || f.vcodec === "none") && f.acodec && f.acodec !== "none",
  );

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

function spawnArgs(url: string): string[] {
  return ["-J", "--no-warnings", "--no-playlist", "--socket-timeout", "20", "--retries", "2", url];
}

function runYtDlpJson(url: string): Promise<YtJson> {
  return new Promise((resolve, reject) => {
    const child = spawn("yt-dlp", spawnArgs(url), {
      stdio: ["ignore", "pipe", "pipe"],
    });
    const out: Buffer[] = [];
    const err: Buffer[] = [];
    child.stdout.on("data", (d) => out.push(d));
    child.stderr.on("data", (d) => err.push(d));
    child.on("error", (e) =>
      reject(new ExtractError("degraded", 502, e.message)),
    );
    child.on("close", (code) => {
      const stderr = Buffer.concat(err).toString("utf8");
      if (code !== 0) {
        if (/private|unavailable|removed|not exist/i.test(stderr)) {
          return reject(
            new ExtractError("unavailable", 404, stderr.slice(0, 200)),
          );
        }
        return reject(
          new ExtractError("degraded", 502, stderr.slice(0, 200)),
        );
      }
      try {
        resolve(JSON.parse(Buffer.concat(out).toString("utf8")));
      } catch {
        reject(new ExtractError("degraded", 502, "yt-dlp json parse failed"));
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

export function runDownload(
  url: string,
  formatId: string,
  title?: string,
  ext?: string,
): Promise<DownloadResult> {
  return new Promise((resolve, reject) => {
    const args = ["-f", formatId, "-o", "-", "--no-warnings", "--no-playlist", url];
    const child = spawn("yt-dlp", args, { stdio: ["ignore", "pipe", "pipe"] });
    const errChunks: Buffer[] = [];
    child.stderr.on("data", (d) => { process.stderr.write(d); errChunks.push(d); });
    child.on("error", (e) => reject(new ExtractError("degraded", 502, e.message)));

    const safeName = (title ?? "download").replace(/[^\w\d. -]/g, "_").slice(0, 100);
    const safeExt = ext ?? "mp4";
    const filename = `${safeName}.${safeExt}`;

    child.stdout.once("readable", () =>
      resolve({ stream: child.stdout, contentType: "application/octet-stream", filename }),
    );

    child.on("close", (code) => {
      if (code !== 0) {
        const stderr = Buffer.concat(errChunks).toString("utf8");
        reject(new ExtractError("degraded", 502, stderr.slice(0, 200) || `yt-dlp exited ${code}`));
      }
    });
  });
}
