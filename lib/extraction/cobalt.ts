import type { Platform, ContentType, Format, ExtractItem, ExtractResult } from "./types";
import { ExtractError } from "./errors";

// --- Cobalt API types ---

type CobaltRequest = {
  url: string;
  videoQuality?: string;
  audioFormat?: string;
  audioBitrate?: string;
  downloadMode?: "auto" | "audio" | "mute";
};

type CobaltPickerItem = {
  type: "photo" | "video" | "gif";
  url: string;
  thumb?: string;
};

type CobaltSuccessResponse =
  | { status: "tunnel"; url: string; filename: string }
  | { status: "redirect"; url: string; filename: string }
  | { status: "picker"; picker: CobaltPickerItem[]; audio?: string; audioFilename?: string }
  | { status: "local-processing"; tunnel: string[]; output: { type: string; filename: string } };

type CobaltErrorResponse = {
  status: "error";
  error: { code: string; context?: { service?: string; limit?: number } };
};

type CobaltResponse = CobaltSuccessResponse | CobaltErrorResponse;

// --- Config ---

function cobaltConfig() {
  const url = process.env.WORKER_URL;
  const token = process.env.WORKER_TOKEN;
  if (!url) throw new ExtractError("degraded", 503, "Cobalt not configured");
  return { url: url.replace(/\/$/, ""), token };
}

// --- Error mapping ---

function mapCobaltError(code: string): { errorCode: string; httpStatus: number } {
  if (code.includes("unavailable") || code.includes("private")) {
    return { errorCode: "unavailable", httpStatus: 404 };
  }
  if (code.includes("live")) return { errorCode: "unavailable", httpStatus: 400 };
  if (code.includes("link") || code.includes("url")) return { errorCode: "invalid_url", httpStatus: 400 };
  if (code.includes("rate")) return { errorCode: "rate_limited", httpStatus: 429 };
  if (code.includes("auth")) return { errorCode: "auth_required", httpStatus: 403 };
  return { errorCode: "degraded", httpStatus: 502 };
}

// --- Cobalt fetch ---

async function cobaltFetch(body: CobaltRequest): Promise<CobaltSuccessResponse> {
  const { url, token } = cobaltConfig();
  const headers: Record<string, string> = {
    accept: "application/json",
    "content-type": "application/json",
  };
  if (token) headers.authorization = `Api-Key ${token}`;

  const res = await fetch(`${url}/`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as CobaltResponse;
  if (data.status === "error") {
    const { errorCode, httpStatus } = mapCobaltError(data.error.code);
    throw new ExtractError(errorCode, httpStatus, data.error.code);
  }
  return data;
}

// --- Format ID encoding ---
// "cobalt:<mode>:<quality>[:<bitrate>]"

export function encodeCobaltFormat(
  mode: "auto" | "audio" | "mute",
  quality: string,
  bitrate?: string,
): string {
  const parts = ["cobalt", mode, quality];
  if (bitrate) parts.push(bitrate);
  return parts.join(":");
}

export function decodeCobaltFormat(
  formatId: string,
): Omit<CobaltRequest, "url"> | null {
  if (!formatId.startsWith("cobalt:")) return null;
  const [, mode, quality, bitrate] = formatId.split(":");
  if (mode === "audio") {
    return { downloadMode: "audio", audioFormat: quality, audioBitrate: bitrate };
  }
  return { downloadMode: mode as "auto" | "mute", videoQuality: quality };
}

// --- Format presets ---

function videoFormats(): Format[] {
  return [
    { formatId: encodeCobaltFormat("auto", "1080"), quality: "1080p", ext: "mp4", delivery: "direct" },
    { formatId: encodeCobaltFormat("auto", "720"), quality: "720p", ext: "mp4", delivery: "direct" },
    { formatId: encodeCobaltFormat("auto", "480"), quality: "480p", ext: "mp4", delivery: "direct" },
    { formatId: encodeCobaltFormat("auto", "360"), quality: "360p", ext: "mp4", delivery: "direct" },
    { formatId: encodeCobaltFormat("audio", "mp3", "128"), quality: "Audio", ext: "mp3", delivery: "direct" },
  ];
}

function audioFormats(): Format[] {
  return [
    { formatId: encodeCobaltFormat("audio", "mp3", "320"), quality: "320kbps", ext: "mp3", delivery: "direct" },
    { formatId: encodeCobaltFormat("audio", "mp3", "128"), quality: "128kbps", ext: "mp3", delivery: "direct" },
    { formatId: encodeCobaltFormat("audio", "ogg", "128"), quality: "OGG", ext: "ogg", delivery: "direct" },
  ];
}

// --- Title from cobalt filename ---

function titleFromFilename(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/_\d{3,4}p$/, "")
    .replace(/[_-]+/g, " ")
    .trim() || "Untitled";
}

// --- Extract ---

export async function cobaltExtract(
  url: string,
  platform: Platform,
  contentType: ContentType,
): Promise<ExtractResult> {
  const probe = await cobaltFetch({ url, videoQuality: "720" });

  if (probe.status === "picker") {
    const items: ExtractItem[] = probe.picker.map((item, i) => ({
      id: String(i),
      type: item.type === "photo" ? ("photo" as const) : ("video" as const),
      formats:
        item.type === "photo"
          ? [{ formatId: `direct:${i}`, quality: "Original", ext: "jpg", delivery: "direct" as const, directUrl: item.url }]
          : videoFormats(),
    }));
    const thumb = probe.picker.find((p) => p.thumb)?.thumb;
    const resolved: ContentType =
      probe.picker.length > 1
        ? "carousel"
        : probe.picker[0]?.type === "photo"
          ? "photo"
          : "video";
    return {
      platform,
      contentType: resolved,
      title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} media`,
      thumbnail: thumb,
      items,
    };
  }

  if (probe.status === "local-processing") {
    return {
      platform,
      contentType: contentType === "unknown" ? "video" : contentType,
      title: titleFromFilename(probe.output?.filename ?? "Media"),
      items: [{
        id: "0",
        type: contentType === "audio" ? "audio" : "video",
        formats: contentType === "audio" ? audioFormats() : videoFormats(),
      }],
    };
  }

  // tunnel or redirect
  const filename = probe.filename || "download";
  const title = titleFromFilename(filename);
  const ext = filename.split(".").pop() || "mp4";
  const isAudio = contentType === "audio" || /^(mp3|ogg|wav|opus|flac|m4a)$/.test(ext);

  return {
    platform,
    contentType: isAudio ? "audio" : contentType === "unknown" ? "video" : contentType,
    title,
    items: [{
      id: "0",
      type: isAudio ? "audio" : "video",
      formats: isAudio ? audioFormats() : videoFormats(),
    }],
  };
}

// --- Download ---

export async function cobaltDownload(
  url: string,
  formatId: string,
): Promise<{ downloadUrl: string; filename: string }> {
  const params = decodeCobaltFormat(formatId);
  if (!params) throw new ExtractError("internal", 400, "Invalid cobalt format ID");

  const response = await cobaltFetch({ ...params, url });

  if (response.status === "tunnel" || response.status === "redirect") {
    return { downloadUrl: response.url, filename: response.filename };
  }

  if (response.status === "local-processing") {
    const tunnelUrl = response.tunnel?.[0];
    if (!tunnelUrl) throw new ExtractError("degraded", 502, "No tunnel URL in local-processing response");
    return { downloadUrl: tunnelUrl, filename: response.output?.filename ?? "download" };
  }

  if (response.status === "picker") {
    const first = response.picker[0];
    if (!first) throw new ExtractError("unavailable", 404, "No media found");
    return {
      downloadUrl: first.url,
      filename: `download.${first.type === "photo" ? "jpg" : "mp4"}`,
    };
  }

  throw new ExtractError("degraded", 502, "Unexpected cobalt response");
}
