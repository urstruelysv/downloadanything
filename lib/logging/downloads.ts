import { supabaseService } from "@/lib/auth/supabase-server";

export type DownloadLogEntry = {
  userId: string | null;
  ip: string;
  url: string;
  platform: string;
  format: string | null;
  status: "success" | "error";
};

export function logDownload(entry: DownloadLogEntry): void {
  supabaseService()
    .from("downloads")
    .insert({
      user_id: entry.userId,
      ip: entry.ip,
      url: entry.url,
      platform: entry.platform,
      format: entry.format,
      status: entry.status,
    })
    .then(({ error }: { error: unknown }) => {
      if (error) console.error("[download-log]", error);
    });
}
