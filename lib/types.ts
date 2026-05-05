export type Platform =
  | "youtube"
  | "instagram"
  | "tiktok"
  | "twitter"
  | "facebook"
  | "reddit"
  | "pinterest"
  | "vimeo"
  | "soundcloud"
  | "generic";

export type ContentType =
  | "video"
  | "photo"
  | "carousel"
  | "audio"
  | "playlist"
  | "unknown";

export type Delivery = "direct" | "worker-stream" | "worker-r2";

export type Format = {
  formatId: string;
  quality: string;
  ext: string;
  sizeBytes?: number;
  delivery: Delivery;
  directUrl?: string;
  directHeaders?: Record<string, string>;
};

export type ExtractItem = {
  id: string;
  type: "video" | "photo" | "audio";
  formats: Format[];
};

export type ExtractResult = {
  platform: Platform;
  contentType: ContentType;
  title: string;
  thumbnail?: string;
  duration?: number;
  items: ExtractItem[];
};

export type Plan = "free" | "subscribed";

export type QuotaResult = {
  allowed: boolean;
  remaining: number;
  plan: Plan;
  reason?: "quota_exceeded" | "rate_limited";
};

export type ApiError =
  | "invalid_url"
  | "unsupported_platform"
  | "unavailable"
  | "quota_exceeded"
  | "rate_limited"
  | "auth_required"
  | "degraded"
  | "internal";
