import type { Platform, ContentType, Format, ExtractItem, ExtractResult } from "@/shared/types";
import { ExtractError } from "@/shared/errors";

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

  if (!url) {
    throw new ExtractError("degraded", 503, "Cobalt not configured");
  }

  return {
    url: url.replace(/\/$/, ""),
    token,
  };
}

// --- Error mapping ---

function mapCobaltError(code: string): { errorCode: string; httpStatus: number } {
  if (
    code.includes("unavailable") ||
    code.includes("private") ||
    code.includes("protected")
  ) {
    return { errorCode: "unavailable", httpStatus: 404 };
  }

  if (code.includes("live")) {
    return { errorCode: "unavailable", httpStatus: 400 };
  }

  if (
    code.includes("link") ||
    code.includes("url") ||
    code.includes("unsupported")
  ) {
    return { errorCode: "invalid_url", httpStatus: 400 };
  }

  if (code.includes("rate")) {
    return { errorCode: "rate_limited", httpStatus: 429 };
  }

  if (code.includes("auth")) {
    return { errorCode: "auth_required", httpStatus: 403 };
  }

  if (
    code.includes("fetch") ||
    code.includes("fail") ||
    code.includes("empty") ||
    code.includes("timeout") ||
    code.includes("codec")
  ) {
    return { errorCode: "unavailable", httpStatus: 502 };
  }

  return { errorCode: "degraded", httpStatus: 502 };
}

// --- Cobalt fetch ---

async function cobaltFetch(body: CobaltRequest): Promise<CobaltSuccessResponse> {
  const { url, token } = cobaltConfig();

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": "DownloadAnything/1.0",
  };
  if (token) {
    headers["Authorization"] = `Api-Key ${token}`;
  }

  let res: Response;

  try {
    res = await fetch(`${url}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (e) {
    throw new ExtractError(
      "degraded",
      502,
      e instanceof Error ? e.message : "Failed to reach cobalt",
    );
  }

  let data: CobaltResponse;

  try {
    data = (await res.json()) as CobaltResponse;
  } catch {
    throw new ExtractError(
      "degraded",
      502,
      `Cobalt returned non-JSON (HTTP ${res.status})`,
    );
  }

  if (data.status === "error") {
    const { errorCode, httpStatus } = mapCobaltError(data.error.code);

    throw new ExtractError(
      errorCode,
      httpStatus,
      data.error.code,
    );
  }

  return data;
}

// --- Format ID encoding ---

export function encodeCobaltFormat(
  mode: "auto" | "audio" | "mute",
  quality: string,
  bitrate?: string,
): string {
  const parts = ["cobalt", mode, quality];

  if (bitrate) {
    parts.push(bitrate);
  }

  return parts.join(":");
}

export function decodeCobaltFormat(
  formatId: string,
): Omit<CobaltRequest, "url"> | null {
  if (!formatId.startsWith("cobalt:")) {
    return null;
  }

  const [, mode, quality, bitrate] = formatId.split(":");

  if (mode === "audio") {
    return {
      downloadMode: "audio",
      audioFormat: quality,
      audioBitrate: bitrate,
    };
  }

  return {
    downloadMode: mode as "auto" | "mute",
    videoQuality: quality,
  };
}

// --- Helpers ---

const AUDIO_EXTENSIONS = new Set([
  "mp3",
  "ogg",
  "wav",
  "opus",
  "flac",
  "m4a",
]);

const KNOWN_VIDEO_QUALITIES = new Set([
  "144",
  "240",
  "360",
  "480",
  "720",
  "1080",
  "1440",
  "2160",
  "4320",
]);

function extFromFilename(filename: string): string {
  if (!filename.includes(".")) {
    return "mp4";
  }

  return filename.split(".").pop()?.toLowerCase() || "mp4";
}

function titleFromFilename(filename: string): string {
  return (
    filename
      .replace(/\.[^.]+$/, "")
      .replace(/_\d{3,4}p$/, "")
      .replace(/[_-]+/g, " ")
      .trim() || "Untitled"
  );
}

// --- Extract ---

const VIDEO_QUALITY_PRESETS = [
  { label: "4K (2160p)", quality: "2160" },
  { label: "2K (1440p)", quality: "1440" },
  { label: "Full HD (1080p)", quality: "1080" },
  { label: "HD (720p)", quality: "720" },
  { label: "SD (480p)", quality: "480" },
];

export async function cobaltExtract(
  url: string,
  platform: Platform,
  contentType: ContentType,
): Promise<ExtractResult> {
  const probe = await cobaltFetch({ url });

  let result: ExtractResult;

  if (probe.status === "picker") {
    const items: ExtractItem[] = probe.picker.map((item, i) => ({
      id: String(i),
      type:
        item.type === "photo"
          ? "photo"
          : "video",
      formats: [
        {
          formatId: `direct:${i}`,
          quality: "Original",
          ext:
            item.type === "photo"
              ? "jpg"
              : item.type === "gif"
                ? "gif"
                : "mp4",
          delivery: "direct",
          directUrl: item.url,
        },
      ],
    }));

    const thumb = probe.picker.find((p) => p.thumb)?.thumb;

    const resolved: ContentType =
      probe.picker.length > 1
        ? "carousel"
        : probe.picker[0]?.type === "photo"
          ? "photo"
          : "video";

    result = {
      platform,
      contentType: resolved,
      title: `${platform} media`,
      thumbnail: thumb,
      items,
    };
  } else if (probe.status === "local-processing") {
    throw new ExtractError(
      "degraded",
      501,
      "Local processing is not supported yet.",
    );
  } else {
    const filename = probe.filename || "download";
    const title = titleFromFilename(filename);
    const ext = extFromFilename(filename);

    const isAudio =
      contentType === "audio" ||
      AUDIO_EXTENSIONS.has(ext);

    const formats: Format[] = [];

    if (isAudio) {
      formats.push({
        formatId: encodeCobaltFormat("audio", "mp3", "320"),
        quality: "High Quality (320kbps)",
        ext: "mp3",
        delivery: "worker-stream",
      });

      formats.push({
        formatId: encodeCobaltFormat("audio", "mp3", "128"),
        quality: "Standard (128kbps)",
        ext: "mp3",
        delivery: "worker-stream",
      });
    } else {
      for (const preset of VIDEO_QUALITY_PRESETS) {
        formats.push({
          formatId: encodeCobaltFormat("auto", preset.quality),
          quality: preset.label,
          ext: "mp4",
          delivery: "worker-stream",
        });
      }

      formats.push({
        formatId: encodeCobaltFormat("audio", "mp3", "128"),
        quality: "Audio only (MP3)",
        ext: "mp3",
        delivery: "worker-stream",
      });
    }

    result = {
      platform,
      contentType: isAudio
        ? "audio"
        : contentType === "unknown"
          ? "video"
          : contentType,
      title,
      items: [
        {
          id: "0",
          type: isAudio ? "audio" : "video",
          formats,
        },
      ],
    };
  }

  return result;
}

// --- Download ---

export async function cobaltDownload(
  url: string,
  formatId: string,
): Promise<{ downloadUrl: string; filename: string }> {
  const params = decodeCobaltFormat(formatId);

  if (!params) {
    throw new ExtractError(
      "internal",
      400,
      "Invalid cobalt format ID",
    );
  }

  const response = await cobaltFetch({
    ...params,
    url,
  });

  if (
    response.status === "tunnel" ||
    response.status === "redirect"
  ) {
    return {
      downloadUrl: response.url,
      filename: response.filename,
    };
  }

  if (response.status === "local-processing") {
    throw new ExtractError(
      "degraded",
      501,
      "Local processing not supported.",
    );
  }

  if (response.status === "picker") {
    const first = response.picker[0];

    if (!first) {
      throw new ExtractError(
        "unavailable",
        404,
        "No media found",
      );
    }

    return {
      downloadUrl: first.url,
      filename: `download.${
        first.type === "photo" ? "jpg" : "mp4"
      }`,
    };
  }

  throw new ExtractError(
    "degraded",
    502,
    "Unexpected cobalt response",
  );
}