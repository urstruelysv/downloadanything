import { db } from "@/lib/db";
import { downloads } from "@/lib/db/schema";

export type DownloadLogEntry = {
  userId: string | null;
  ip: string;
  url: string;
  platform: string;
  format: string | null;
  status: "success" | "error";
  error?: string;
  bytes?: number;
};

export function logDownload(entry: DownloadLogEntry): void {
  db.insert(downloads)
    .values({
      userId: entry.userId,
      ip: entry.ip,
      url: entry.url,
      platform: entry.platform,
      format: entry.format,
      status: entry.status,
      error: entry.error,
      bytes: entry.bytes,
    })
    .catch((err) => {
      console.error("[download-log] failed:", err);
    });
}
