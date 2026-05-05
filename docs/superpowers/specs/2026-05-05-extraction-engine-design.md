# DownloadAnything — Extraction Engine + Backend v1

**Date:** 2026-05-05
**Status:** Approved (brainstorm). Ready for implementation plan.
**Scope:** Backend rewrite. Replaces current mock-data API routes with a real, multi-platform download backend, plus auth, quota, and subscriptions.

---

## Goal

User pastes any link → system detects platform and content type (video / photo / carousel / audio / playlist) → returns formats → downloads. Free tier limited; paid tier unlimited.

No silent mock fallbacks. Either it works or it returns a clear error.

---

## Decomposition

The full ask is five subsystems. This spec covers subsystem 1 (extraction engine) plus the minimum slices of 2–4 needed to make the product viable end-to-end. Future specs:

- `2026-MM-DD-batch-and-playlists-design.md` — batching, queue, playlist expansion
- `2026-MM-DD-admin-and-abuse-design.md` — admin dashboard, abuse mitigation, refunds

Build order: this spec → (then those, in order written above).

---

## Locked stack

| Concern | Choice | Cost at idle |
| --- | --- | --- |
| Frontend | Vercel (Next.js 15 App Router, React 19) | $0 hobby |
| Worker | Railway Docker container | $5/mo |
| Extraction binaries | `yt-dlp` + `gallery-dl` + `ffmpeg` | $0 |
| Auth + Postgres | Supabase | $0 up to 50k MAU |
| Redis | Upstash | $0 up to 10k cmd/day |
| Big-file storage | Cloudflare R2 | $0 egress, ~$0.015/GB stored |
| Billing | Lemon Squeezy (merchant of record, handles VAT) | 5% + $0.50 per txn |

## Tiers

| Tier | Identity | Daily downloads | Max quality | Playlists | Batch | History |
| --- | --- | --- | --- | --- | --- | --- |
| Anonymous | IP | 5 | 1080p | No | 1 URL | None |
| Signed-in (free) | Supabase user | Same as anonymous | 1080p | No | 1 URL | 7 days |
| Subscribed | Supabase user with active LS sub | Unlimited | Up to 8K | Yes | 50 URLs | Forever |

Login alone gives no extra downloads. Login is the gate to subscribe.

## Pricing

- **$3.99/mo** or **$29/year** (≈ $2.42/mo).
- Single plan. All perks above.
- Pricing rationale: marginal cost ≈ $0.20–0.40/user/mo. Stripe-style fee floor (~$0.50 + 5% on LS) makes anything below $3.99 unprofitable. Yearly thin-margin to drive commitment.

## Day-one platform support

All of the following must work in v1:

- YouTube (videos, audio extract, playlists)
- Instagram (reels, posts, carousels; stories = best-effort, requires session cookies)
- TikTok (with and without watermark)
- Twitter/X (videos and images)
- Facebook (videos)
- Reddit (videos, images, galleries)
- Pinterest (images and videos)
- Vimeo
- SoundCloud (audio-only)
- Generic image/photo from arbitrary URL

---

## Architecture

```
[Browser]
   │ POST /api/extract { url }
   ▼
[Vercel — Next.js API routes]
   ├── detectPlatform(url)
   ├── checkQuota(user|ip) ──► [Upstash Redis]
   ├── lookupUser/sub ──────► [Supabase Postgres]
   ├── try direct-URL extract (lightweight yt-dlp call via worker)
   │     └── if works → return {downloadUrl, headers}
   │           browser fetches direct from source CDN. Done.
   └── else → POST /extract to [Railway worker]
            │
            ▼
       [Worker container: yt-dlp + gallery-dl + ffmpeg]
            ├── small file (<50 MB) → stream bytes back through Vercel
            └── big file → upload to R2, return signed URL (1 hr TTL)

[Lemon Squeezy webhooks] ──► /api/webhooks/lemonsqueezy ──► Supabase subscriptions
```

### Strategy: hybrid direct-URL + worker fallback

1. Always try direct-URL first. yt-dlp can return the source CDN URL plus required headers without downloading. Browser fetches directly. Zero bandwidth on our infra.
2. Fall back to the worker when:
   - Source URL is signed/short-lived in a way the browser cannot replay (some Instagram/TikTok cases).
   - Audio + video need to be merged (YouTube DASH).
   - User asked for transcoded format (e.g., MP3 from a video).
   - Carousel needs to be zipped.
3. Free tier rides direct-URL when possible. Paid tier always gets worker fallback so it never fails.

---

## Components

### 1. Platform detector — `lib/platform/detector.ts`

Pure function. URL → `{ platform, contentType }`.

```ts
type Platform =
  | 'youtube' | 'instagram' | 'tiktok' | 'twitter' | 'facebook'
  | 'reddit' | 'pinterest' | 'vimeo' | 'soundcloud' | 'generic';

type ContentType = 'video' | 'photo' | 'carousel' | 'audio' | 'playlist' | 'unknown';

function detect(url: string): { platform: Platform; contentType: ContentType } | null;
```

Implementation: regex map. Replaces current `lib/utils/platform-detector.ts`.

### 2. Extractor router — `lib/extract/router.ts`

Single entry point: `extract(url, opts) → Promise<ExtractResult>`. Picks per-platform strategy (yt-dlp vs gallery-dl, direct vs worker). Owns retry policy.

```ts
type ExtractResult = {
  platform: Platform;
  contentType: ContentType;
  title: string;
  thumbnail?: string;
  duration?: number;
  items: ExtractItem[]; // multiple for carousel/playlist; one for single
};

type ExtractItem = {
  id: string;
  type: 'video' | 'photo' | 'audio';
  formats: Format[];
};

type Format = {
  quality: string;        // e.g. "1080p", "320kbps"
  ext: string;            // mp4, mp3, jpg
  sizeBytes?: number;
  // delivery hint: how the download endpoint should serve this
  delivery: 'direct' | 'worker-stream' | 'worker-r2';
  directUrl?: string;
  directHeaders?: Record<string, string>;
};
```

### 3. Worker service — `worker/` (new directory)

- Runtime: Node 24 + Express (or Hono).
- Image: `Dockerfile` installs `yt-dlp`, `gallery-dl`, `ffmpeg`, `python3`.
- Endpoints:
  - `POST /extract { url }` → returns `ExtractResult` (no file bytes).
  - `POST /download { url, formatId }` → returns file bytes (small) or `{ r2Url }` (large).
- Auth: shared secret `X-Worker-Token` header. Rejects without it.
- Health: `GET /healthz`.
- Deploys to Railway from this repo's `worker/` directory via Railway's built-in Dockerfile build.

### 4. Quota service — `lib/quota/`

- `checkAnon(ip) → { allowed: boolean; remaining: number }`
  - Key: `quota:anon:{ip}:{YYYY-MM-DD}`. `INCR`, set 24 h TTL on first INCR. Cap = 5.
- `checkUser(userId) → { allowed: boolean; plan: 'subscribed' | 'free' }`
  - Subscribed → unlimited. Free → falls through to anon limits keyed by user ID.
- Per-IP burst rate limit independent of tier: 1 req/sec at edge via Upstash.

### 5. Auth — `lib/auth/`

- Supabase Auth. Providers: email magic link + Google OAuth.
- Server-side: verify JWT in API routes via Supabase server client.
- No middleware-level auth — routes opt in.

### 6. Billing — `lib/billing/lemonsqueezy.ts` + `app/api/webhooks/lemonsqueezy/route.ts`

- `createCheckoutUrl(userId, plan)` → returns hosted checkout URL with custom data `{ user_id }`.
- Webhook handler:
  - Verifies HMAC signature with `LEMONSQUEEZY_WEBHOOK_SECRET`.
  - Handles: `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_expired`, `subscription_payment_success`, `subscription_payment_failed`.
  - Idempotent upsert into `subscriptions` keyed by `ls_subscription_id`.

### 7. API routes (Next.js App Router)

Replace all current `app/api/*` routes with:

- `POST /api/extract` — body `{ url }` → `ExtractResult`. Quota-gated.
- `POST /api/download` — body `{ url, formatId }` → 302 to direct URL OR streams bytes OR JSON `{ r2Url }`. Quota-gated. Records `downloads` row.
- `POST /api/checkout` — body `{ plan: 'monthly' | 'yearly' }` → `{ url }`. Auth required.
- `POST /api/webhooks/lemonsqueezy` — LS webhook receiver.
- `GET /api/me` — current user + sub status. Auth required.

Delete: `app/api/download-instagram`, `download-tiktok`, `download-youtube`, `fetch-video`, `video-info`.

---

## Data model (Supabase Postgres)

```sql
-- users handled by supabase auth (auth.users)

create table subscriptions (
  user_id uuid primary key references auth.users,
  ls_subscription_id text unique,
  status text not null,           -- active | cancelled | expired | past_due
  plan text not null,             -- monthly | yearly
  renews_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,   -- null = anonymous
  ip inet,
  url text not null,
  platform text not null,
  format text,
  bytes bigint,
  status text not null,           -- success | failed
  error text,
  created_at timestamptz default now()
);
create index on downloads (user_id, created_at desc);
create index on downloads (ip, created_at desc);
```

RLS: `subscriptions` selectable only by owning user; `downloads` selectable only by owning user. Service role bypasses both for server writes.

---

## Data flow examples

### Anonymous user, single YouTube video, 1080p

1. `POST /api/extract { url }` from browser.
2. Detector → `youtube/video`. Quota check on IP → 3/5 used, allow.
3. Call worker `/extract` → returns formats. 1080p has `delivery: 'worker-r2'` because YouTube needs audio+video merge.
4. Browser receives `ExtractResult`, displays formats.
5. `POST /api/download { url, formatId }` → API calls worker `/download` → worker merges with ffmpeg, uploads to R2, returns signed URL → API returns `{ r2Url }`.
6. Browser fetches R2 URL.
7. Insert `downloads` row.

### Subscribed user, Instagram carousel of 8 photos

1. `POST /api/extract` → detector `instagram/carousel`. Quota → subscribed, unlimited.
2. Worker uses `gallery-dl` → returns 8 items, each with direct URL.
3. Browser sees "Download all" → `POST /api/download { url, formatId: 'all' }`.
4. Worker downloads all 8, zips, uploads to R2, returns signed URL.
5. Browser fetches.

### Anonymous user over quota

1. `POST /api/extract` → quota check fails (5/5).
2. Returns `429` with body `{ error: 'quota_exceeded', message: 'Sign up and subscribe for unlimited downloads.', upgradeUrl: '/pricing' }`.

---

## Error handling

| Failure | HTTP | Response |
| --- | --- | --- |
| Invalid URL | 400 | `{ error: 'invalid_url' }` |
| Unsupported platform | 400 | `{ error: 'unsupported_platform', supported: [...] }` |
| Source 404 / private | 404 | `{ error: 'unavailable', message: 'Video unavailable or private' }` |
| yt-dlp transient | — | Retry 2× with exponential backoff (1s, 3s). Then 503. |
| Worker unreachable | — | Try direct-URL path. If that fails too, 503 `{ error: 'degraded' }` |
| R2 upload fail | — | Fall back to stream-through. |
| Quota exceeded (anon) | 429 | `{ error: 'quota_exceeded', upgradeUrl: '/pricing' }` |
| LS webhook signature mismatch | 401 | drop. LS will retry. |

No silent mock fallbacks. The current code returns mock data on failure — that ships and we look like liars. Removed entirely.

---

## Testing

- **Unit**: detector regex per platform with real-URL fixtures. Quota math against Redis mock. Webhook signature verification.
- **Integration**: worker `/extract` hits a small set of real public URLs in CI. Tagged `@flaky` because external sites change.
- **E2E**: Playwright nightly — one happy path per platform.
- No tests against the local v0 mock data — that data is being deleted.

---

## Security

- Worker shared-secret auth: `X-Worker-Token` header, value from env `WORKER_TOKEN`. Reject without. Rotate quarterly.
- Webhook HMAC verification with `LEMONSQUEEZY_WEBHOOK_SECRET`.
- SSRF prevention: validate the URL host against an allowlist of known platform domains before passing to the worker. Reject `localhost`, RFC1918, link-local.
- R2 signed URLs: 1 hr TTL. Object key includes random nonce.
- Edge per-IP rate limit independent of tier: 1 req/sec via Upstash.
- Supabase service-role key only in Next.js server runtime, never shipped to client.
- Lemon Squeezy custom data carries `user_id` server-side only — never trust client-supplied user IDs in webhook handlers.

---

## Environment variables

Vercel (Next.js):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `WORKER_URL`
- `WORKER_TOKEN`
- `LEMONSQUEEZY_API_KEY`
- `LEMONSQUEEZY_STORE_ID`
- `LEMONSQUEEZY_VARIANT_ID_MONTHLY`
- `LEMONSQUEEZY_VARIANT_ID_YEARLY`
- `LEMONSQUEEZY_WEBHOOK_SECRET`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`

Railway (worker):
- `WORKER_TOKEN` (same value as Vercel)
- `R2_*` (same values)
- `PORT`

---

## Out of scope for this spec

- Job queue / batch processing (single-URL only in v1)
- Admin dashboard
- Refund flow UI
- Stories with session cookies (best-effort only)
- Public API access (key-based) — possible future tier
- Mobile apps

These get their own specs after v1 is live.

---

## Acceptance criteria

- All ten platform categories above return real data, not mocks.
- Anonymous user blocked at 6th download in 24 h with upgrade CTA.
- Subscribed user can download a 4K YouTube video that requires audio+video merge.
- Subscribed user can download a full Instagram carousel as a zip.
- Lemon Squeezy webhook flips a user from free to subscribed within 30 s of payment.
- Cancellation webhook flips them back at period end.
- No mock data anywhere in the codebase.
- All current `app/api/download-*`, `fetch-video`, `video-info` routes deleted.
