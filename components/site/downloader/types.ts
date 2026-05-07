import type { ExtractResult, Format } from "@/shared/types";

export type DownloadRecord = {
  url: string;
  platform: string | null;
  meta: { title: string; thumbColor: string };
  quality: string;
  format: string;
  completedAt: number;
};

export type ExtractApiResponse = ExtractResult & {
  remaining?: number;
  plan?: "free" | "subscribed";
};

export type Step = "paste" | "analyzing" | "preview" | "downloading" | "done" | "error";
