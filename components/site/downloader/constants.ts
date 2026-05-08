import { platformDisplay } from "@/lib/platform";
import type { Platform } from "@/shared/types";

export function platformLabel(p: string): string {
  return platformDisplay(p as Platform).label;
}

export function platformGradient(p: string): string {
  return platformDisplay(p as Platform).gradient;
}

export function fmtDuration(s?: number): string {
  if (!s || s <= 0) return "—";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function fmtBytes(b?: number): string {
  if (!b) return "";
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

import { ERROR_LABELS } from "@/shared/errors";
import type { ErrorCode } from "@/shared/types";

export function labelForError(code: string): string {
  return ERROR_LABELS[code as ErrorCode] ?? "Something went wrong.";
}
