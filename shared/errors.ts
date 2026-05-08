import type { ErrorCode } from "./types";

export class ExtractError extends Error {
  constructor(
    public code: string,
    public httpStatus: number,
    msg?: string,
  ) {
    super(msg ?? code);
    this.name = "ExtractError";
  }
}

export const ERROR_LABELS: Record<ErrorCode, string> = {
  invalid_url: "That URL doesn't look right.",
  unsupported_platform: "We don't support this platform yet.",
  unavailable: "Source is private or removed.",
  quota_exceeded: "Daily limit reached. Subscribe for unlimited downloads.",
  rate_limited: "Too many requests. Slow down for a moment.",
  auth_required: "Sign in required.",
  degraded: "Extraction service is degraded. Try again in a minute.",
  network: "Network error.",
  internal: "Something went wrong.",
};
