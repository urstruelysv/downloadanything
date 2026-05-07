# DownloadAnything — Project Context & PRD

## Problem Statement

DownloadAnything is a media download web app: paste a link from any major platform, pick a format, download the file. The app exists but is not shippable. The current extraction backend (yt-dlp on localhost) only works for YouTube and Vimeo. Instagram, TikTok, X/Twitter, Reddit, SoundCloud, Pinterest, and Facebook all fail because these platforms block server IPs or require authentication cookies. Auth is broken, the preview step has issues, and the worker has never been deployed — it runs only on the developer's machine.

## Solution

Replace the yt-dlp worker with a self-hosted **cobalt** instance on Railway. Cobalt is an open-source media extraction service that already solved the hard platform-specific reverse-engineering for Instagram, TikTok, X/Twitter, Reddit, SoundCloud, Pinterest, Facebook, and Vimeo. Keep the existing yt-dlp worker code in the repo as fallback but do not deploy it. YouTube support from cobalt (if available when self-hosted) replaces yt-dlp; if cobalt lacks YouTube, re-add yt-dlp as a second Railway service or keep it as a Vercel-side proxy to cobalt.

Fix auth, fix preview, deploy, ship.

---

## Current Architecture

```
Next.js 15 app (Vercel)               Worker (NOT DEPLOYED — localhost only, SUPERSEDED by cobalt adapter)
├── app/                               worker/
│   ├── page.tsx (landing + modal)     ├── src/server.ts    (Hono HTTP entry)
│   ├── api/extract/route.ts           ├── src/app.ts       (Hono routes)
│   ├── api/download/route.ts          ├── src/extractor.ts (yt-dlp wrapper)
│   ├── api/me/route.ts                ├── src/r2.ts        (R2 upload)
│   ├── api/checkout/route.ts          └── src/types.ts     (re-exports shared)
│   ├── api/webhooks/lemonsqueezy/
│   ├── auth/callback/route.ts
│   ├── login/page.tsx
│   └── account/page.tsx
├── components/site/
│   ├── hero.tsx (landing hero + nav auth)
│   ├── sections.tsx (features, pricing, FAQ, etc.)
│   ├── platforms.tsx (platform icon components)
│   ├── logo.tsx
│   └── downloader/          (decomposed modal)
│       ├── index.tsx         (thin orchestrator)
│       ├── types.ts          (DownloadRecord, Step, ExtractApiResponse)
│       ├── constants.ts      (labels, colors, formatters, error labels)
│       ├── use-extraction.ts (hook: state, API calls, AbortController)
│       ├── paste-view.tsx
│       ├── spinner-view.tsx
│       ├── preview-view.tsx
│       ├── done-view.tsx
│       └── error-view.tsx
├── lib/
│   ├── platform/index.ts    (URL detection, platform registry)
│   ├── extraction/cobalt.ts (NEW — cobalt API client, adapter, format encoding)
│   ├── extraction/index.ts  (extract() + download() now route through cobalt)
│   ├── extraction/types.ts  (re-exports shared types)
│   ├── extraction/errors.ts (re-exports ExtractError)
│   ├── auth/supabase-server.ts (server client, service client, getCurrentUser, getUserPlan)
│   ├── auth/supabase-browser.ts (browser client singleton)
│   ├── quota/index.ts       (checkAnon, checkUser, consumeAnon, consumeUser)
│   ├── quota/redis.ts       (Upstash Redis client)
│   ├── http/with-api.ts     (route middleware: auth, quota, URL validation)
│   ├── http/errors.ts       (jsonError helper)
│   ├── http/ip.ts           (client IP extraction)
│   ├── billing/lemonsqueezy.ts
│   └── storage/r2.ts
├── hooks/use-auth.ts        (client-side auth hook)
├── shared/types.ts          (canonical Platform, ContentType, Delivery, Format, ExtractResult, etc.)
├── shared/errors.ts         (canonical ExtractError class)
└── middleware.ts             (Supabase session refresh)
```

## External Services — All Real, All on Free Tiers

| Service | Purpose | Status | Cost risk |
|---------|---------|--------|-----------|
| **Vercel** | Next.js hosting | Deployed, live | None (free tier) |
| **Supabase** | Auth (magic link + Google OAuth) + DB logging (downloads table, subscriptions table) | Credentials configured, real | None (free tier, no card) |
| **Upstash Redis** | Rate limiting (1 req/sec) + daily quota (5/day free, unlimited subscribed) | Credentials configured, real | None (free tier, pauses at limit) |
| **Cloudflare R2** | Large file staging (>50MB files uploaded by worker, served via presigned URL) | Credentials configured, real | Low — only charges if worker uploads; worker not deployed. Check if Cloudflare account has a card |
| **LemonSqueezy** | Payment / subscriptions ($3.99/mo or $29/yr) | **NOT configured** — API key and store ID are empty | None |
| **Railway** | Cobalt hosting | Account created, **nothing deployed**. Image: `ghcr.io/imputnet/cobalt`, port 9000, env: `API_URL` | None ($5 trial, services pause when exhausted) |

## What Works Right Now (tested 2026-05-08)

| Component | Status |
|-----------|--------|
| Next.js app on Vercel | Deployed, serves pages |
| Typecheck (app) | Passes |
| Typecheck (worker) | Passes |
| Vitest (42 tests, 4 files) | All pass |
| Cobalt adapter (`lib/extraction/cobalt.ts`) | **BUILT** — format encode/decode, extract/download mapping, error handling |
| Cobalt adapter tests (14 tests) | All pass — covers tunnel, redirect, picker, audio, error responses |
| Extraction module (`lib/extraction/index.ts`) | **REWIRED** to cobalt (yt-dlp workerFetch removed) |
| Cobalt instance on Railway | **NOT DEPLOYED** — adapter code ready, needs Railway deployment |
| Platform extraction (all platforms) | **BLOCKED** on cobalt deployment — adapter code is ready |
| Auth (Google OAuth) | **BROKEN** — Google provider disabled in Supabase dashboard (confirmed) |
| Auth (magic link) | **LIKELY WORKS** — code correct, needs real email test + dashboard redirect URL check |
| Auth (session persistence) | **AT RISK** — `@supabase/ssr` 0.5.2 is outdated (latest 0.10.3), cookie issues likely |

**Cobalt adapter replaces all yt-dlp extraction.** The old `workerFetch` code is removed from `index.ts`. Worker code still in `worker/` directory as reference only.

## Known Bugs in Current Code

### 1. Auth is broken — DIAGNOSED (2026-05-08)
Root causes identified:
- **Google OAuth disabled in Supabase dashboard.** The `/auth/v1/settings` endpoint confirms `"google": false`. Must enable Google provider in Supabase dashboard with OAuth client ID + secret from Google Cloud Console.
- **`@supabase/ssr` outdated.** Installed 0.5.2, latest is 0.10.3. Five major versions behind — cookie handling fixes for Next.js 15 are missing. Upgrade needed: `npm install @supabase/ssr@latest`.
- **Redirect URLs may not be configured.** Supabase dashboard must include `http://localhost:3000/auth/callback` (dev) and the production Vercel URL in the redirect URL allowlist. Cannot verify from API — needs manual dashboard check.
- **Auth code is structurally correct.** Callback route, middleware, browser/server clients, useAuth hook all follow standard Supabase SSR patterns. No logic bugs.
- **Magic link likely works** with a real email address (test@example.com was rejected due to reserved domain, not a code issue).

**To fix:**
1. Upgrade `@supabase/ssr` to latest (`npm install @supabase/ssr@latest`)
2. Enable Google OAuth in Supabase dashboard (requires Google Cloud Console OAuth credentials)
3. Add redirect URLs to Supabase dashboard allowlist
4. Browser-test both flows end-to-end

### 2. Preview not working
- PreviewView component exists and renders thumbnail, format grid, download button
- **Specific breakage not yet diagnosed** — needs browser testing after cobalt is deployed. May "just work" now that cobalt adapter returns proper `ExtractResult` with format grids. If not, likely a data shape issue between cobalt's simplified metadata (no thumbnail/duration for non-picker responses) and what PreviewView renders.

### 3. Uncommitted bug fixes (in working tree)
- **R2 always used:** `worker/src/app.ts` condition was inverted — all downloads went to R2 regardless of size. Fixed: stream by default, only R2 for known-large files (>50MB).
- **Worker crash on spawn error:** `worker/src/extractor.ts` threw inside event listener (unhandled). Fixed: rewrote `runDownload` as Promise-based with proper reject.
- **Old monolithic modal deleted:** `components/site/downloader-modal.tsx` (724 lines) removed, replaced by decomposed `components/site/downloader/` directory.

## Target Architecture (after this work)

```
User's browser
    │
    ├── GET pages ──→ Vercel (Next.js)
    │
    ├── POST /api/extract ──→ Vercel API route ──→ Cobalt (Railway) ──→ platform APIs
    │                         (auth, quota check)    (extraction)
    │
    └── POST /api/download ──→ Vercel API route ──→ redirect to direct URL from cobalt
                               (quota consume)       OR proxy stream for formats that need it
```

### Key change: Cobalt replaces yt-dlp worker

**Cobalt** (github.com/imputnet/cobalt) is an open-source media extraction service.

Cobalt public API (api.cobalt.tools) confirmed live (v11.7.1). Supports: bilibili, bluesky, dailymotion, facebook, instagram, loom, ok, pinterest, newgrounds, reddit, rutube, snapchat, soundcloud, streamable, tiktok, tumblr, twitch clips, twitter, vimeo, vk.

**Public API requires Cloudflare Turnstile** (browser captcha) — cannot be called from server. Must self-host on Railway to bypass Turnstile.

**YouTube:** Not listed in public instance's services. May be available when self-hosted (possibly removed from public instance for legal/capacity reasons). Must verify after deploying. If cobalt lacks YouTube, fall back to yt-dlp for YouTube only.

#### Cobalt API Reference (for self-hosted instance)

- **Docker image:** `ghcr.io/imputnet/cobalt`
- **Default port:** 9000
- **Health:** `GET /` → returns `{ cobalt: { version, url, services[] }, git: { commit, branch } }`
- **Extract/Download:** `POST /` with `Accept: application/json`, `Content-Type: application/json`
  - Request: `{ url, videoQuality?, audioFormat?, audioBitrate?, downloadMode? }`
  - `downloadMode`: `auto` (default) | `audio` | `mute`
  - `videoQuality`: `max | 4320 | 2160 | 1440 | 1080 | 720 | 480 | 360 | 240 | 144` (default: 1080)
  - Response status field: `tunnel` | `redirect` | `picker` | `local-processing` | `error`
  - `tunnel/redirect`: `{ status, url, filename }` — url is the download link
  - `picker`: `{ status, picker: [{ type, url, thumb? }] }` — multiple items (carousels)
  - `error`: `{ status: "error", error: { code, context? } }` — machine-readable error code
- **Auth:** Optional `Authorization: Api-Key <token>` header
- **Required env:** `API_URL` (instance's public URL)

### Modules to build/modify

1. **Cobalt adapter** — ✅ DONE. `lib/extraction/cobalt.ts` maps cobalt's API to our `ExtractResult` type. Key design: cobalt format IDs encode quality params (`cobalt:auto:1080`, `cobalt:audio:mp3:128`). Extract makes one probe call to validate URL + detect content type, returns predefined format options. Download parses format ID, calls cobalt with corresponding params, streams result. Handles tunnel/redirect/picker/local-processing/error responses. 14 unit tests.

2. **Extraction orchestrator** — ✅ DONE. `lib/extraction/index.ts` rewired: `extract()` calls `cobaltExtract()`, `download()` handles cobalt format IDs via `decodeCobaltFormat()` + `cobaltDownload()`. Direct URL path (for picker items) preserved. yt-dlp `workerFetch` removed. Retry logic preserved.

3. **Download flow simplification** — ✅ DONE. `download()` now has two paths: (a) direct URL from picker items → fetch + stream, (b) cobalt format ID → call cobalt → fetch tunnel/redirect URL → stream. R2/worker-stream paths removed.

4. **Auth fix** — 🔶 DIAGNOSED, NOT FIXED. See "Known Bugs" section. Three issues: Google OAuth disabled in Supabase, `@supabase/ssr` outdated (0.5.2 → 0.10.3 needed), redirect URLs need dashboard config. Code is correct.

5. **Preview fix** — ⬜ NOT STARTED. Blocked on cobalt deployment for live testing. May work already with cobalt adapter's `ExtractResult` output. Known gap: cobalt tunnel/redirect responses don't include thumbnail or duration — only filename-derived title. Picker responses do include thumbnails.

6. **Railway deployment** — ⬜ NOT STARTED. Docker image: `ghcr.io/imputnet/cobalt`. Required env: `API_URL` (Railway public URL). Optional: API key auth. Default port: 9000. Steps: deploy Docker image on Railway → get public URL → set `WORKER_URL` in Vercel to that URL.

## User Stories

1. As a visitor, I want to paste any YouTube link and download the video in my chosen quality, so that I can watch it offline.
2. As a visitor, I want to paste an Instagram reel/post link and download the video or image, so that I can save content from Instagram.
3. As a visitor, I want to paste a TikTok link and download the video without watermark, so that I can save TikTok content.
4. As a visitor, I want to paste an X/Twitter link and download the video, so that I can save Twitter media.
5. As a visitor, I want to paste a Reddit video/image link and download it, so that I can save Reddit content.
6. As a visitor, I want to paste a Facebook video link and download it, so that I can save Facebook content.
7. As a visitor, I want to paste a Pinterest pin link and download the image or video, so that I can save Pinterest content.
8. As a visitor, I want to paste a Vimeo link and download the video, so that I can save Vimeo content.
9. As a visitor, I want to paste a SoundCloud link and download the audio, so that I can listen offline.
10. As a visitor, I want to see a thumbnail, title, duration, and available formats before downloading, so that I can pick the right quality and format.
11. As a visitor, I want to see which platform was detected from my link, so that I know the app recognized it correctly.
12. As a visitor, I want the download to start automatically and show progress, so that I know it's working.
13. As a visitor, I want to see a clear success state when download completes, so that I know the file was saved.
14. As a visitor, I want to see a clear error message when something fails (private content, unsupported link, etc.), so that I know what went wrong.
15. As a visitor, I want to see how many free downloads I have left today, so that I can plan my usage.
16. As a visitor, I want to sign up with Google or magic link email, so that I can track my history and upgrade.
17. As a signed-in user, I want to see my download history on the account page, so that I can find past downloads.
18. As a signed-in user, I want to upgrade to Pro ($3.99/mo or $29/yr) for unlimited downloads, so that I'm not limited to 5/day.
19. As an anonymous user, I want to use the app without signing in (5 downloads/day limit), so that I can try before committing.
20. As a user on mobile, I want the modal and entire UI to work on phone screens, so that I can download on the go.
21. As a user, I want rate limiting (1 req/sec) to protect the service from abuse, so that the app stays available for everyone.

## Implementation Decisions

- **Cobalt over yt-dlp for non-YouTube platforms.** yt-dlp cannot extract from Instagram, TikTok, X, Reddit, SoundCloud, Pinterest, or Facebook when running on a server (IP blocking, auth requirements). Cobalt has already reverse-engineered these platforms.
- **Self-hosted cobalt on Railway.** The public cobalt API requires Cloudflare Turnstile (browser captcha). Self-hosting eliminates this requirement. Railway free tier ($5 trial credit) covers a small Docker service for weeks.
- **yt-dlp worker code kept as fallback.** If cobalt doesn't support YouTube when self-hosted, the yt-dlp worker can be deployed alongside cobalt or the code can be adapted. The `worker/` directory stays in the repo.
- **R2 likely unnecessary with cobalt.** Cobalt returns direct download URLs. The browser can download directly from the source platform. R2 was needed for yt-dlp's video+audio merge (large files staged to R2, then served via presigned URL). With cobalt, this merge isn't needed for most platforms. R2 credentials stay configured but may not be used.
- **Delivery types simplify.** `worker-stream` and `worker-r2` paths removed from extraction module. All cobalt downloads use `delivery: "direct"`. Picker items get `directUrl` set directly. Non-picker items have no `directUrl` — the download function calls cobalt on-demand with format params.
- **Cobalt format ID encoding.** Format IDs like `cobalt:auto:1080` or `cobalt:audio:mp3:128` encode cobalt request params. Parsed at download time to reconstruct the cobalt API call. This avoids storing ephemeral URLs between extract and download steps.
- **Cobalt probe call during extract.** One cobalt call per extract (with `videoQuality: 720`) to validate the URL and detect content type. Predefined format options returned based on content type (video gets 1080/720/480/360 + audio-only; audio gets 320/128 mp3 + ogg). Title parsed from cobalt's filename.
- **Quota system stays as-is.** The Upstash-based rate limiting and daily quota (5/day free, unlimited for subscribed) works correctly and doesn't need changes.
- **Auth uses Supabase with Google OAuth + magic link.** Code is structurally correct. Bug needs browser diagnosis — likely a Supabase dashboard config issue (redirect URLs) rather than code.
- **LemonSqueezy not configured.** Payment integration exists in code but API keys are empty. Out of scope for v1 ship — free tier only.
- **No budget constraint.** All services on free tiers. Railway $5 trial is the only resource that depletes. When it runs out, services pause (no surprise charges). Revenue from ads or subscriptions would fund Hobby plan ($5/mo).

## Testing Decisions

- **Browser testing is the primary verification method.** The core user flow (paste URL → analyze → preview → download → done) must be tested manually in a browser against each supported platform.
- **Vitest (42 tests, 4 files) cover:** platform URL detection, extraction error handling, worker auth, and cobalt adapter mapping. All pass.
- **Cobalt adapter tests (`__tests__/cobalt-adapter.test.ts`):** 14 tests covering format ID encode/decode roundtrips, tunnel→ExtractResult mapping, redirect→ExtractResult mapping, picker→carousel mapping, audio content detection, and error response handling. Uses mocked `fetch` with realistic cobalt response payloads.
- **Do not test:** Supabase auth flow (integration, not unit-testable without browser), UI rendering (manual browser test), cobalt extraction itself (external service).

## Out of Scope

- **LemonSqueezy payment integration** — keys not configured, not needed for v1
- **Pro-tier features** — 8K downloads, playlists, batch downloads, permanent history
- **Platform-specific extractors** — no custom scraping; cobalt handles all platform logic
- **Residential proxies** — not needed if cobalt works
- **Cookie management** — not needed if cobalt works
- **Mobile app** — web only
- **Download history persistence** — works via Supabase for signed-in users; local-only (React state) for anonymous users, which is fine for v1
- **Analytics / monitoring** — not needed for v1
- **Custom domain** — using Vercel's default domain for now

## Domain Vocabulary

| Term | Meaning |
|------|---------|
| Platform | Source site (youtube, instagram, tiktok, twitter, facebook, reddit, pinterest, vimeo, soundcloud, generic) |
| ContentType | What the URL points to (video, photo, carousel, audio, playlist, unknown) |
| Delivery | How file reaches user: `direct` (redirect to source URL), `worker-stream` (proxied), `worker-r2` (staged via R2 presigned URL) |
| ExtractResult | Metadata + available formats returned by extraction backend |
| ExtractApiResponse | ExtractResult + quota info (`remaining`, `plan`) added by API route |
| Format | Single downloadable variant (quality + ext + delivery method + optional directUrl) |
| ExtractError | Unified error class (code + httpStatus), used by both app and worker |
| ErrorCode | Union: invalid_url, unsupported_platform, unavailable, quota_exceeded, rate_limited, auth_required, degraded, network, internal |
| Cobalt | Open-source media extraction service (github.com/imputnet/cobalt) — the new extraction backend |
| yt-dlp | CLI tool for downloading media — the old extraction backend, kept as fallback for YouTube |

## Stack

- Next.js 15, React 19, Tailwind CSS 3
- Supabase (auth + DB logging)
- Upstash Redis (rate limiting + quota)
- Cobalt (self-hosted on Railway, extraction backend) — **TO DEPLOY**
- Cloudflare R2 (large file staging — may not be needed with cobalt)
- LemonSqueezy (payments — NOT CONFIGURED)
- Vitest (testing)

## Env Vars Required

### Vercel (Next.js app)
```
NEXT_PUBLIC_APP_URL          — app URL
NEXT_PUBLIC_SUPABASE_URL     — Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY — Supabase anon key
SUPABASE_SERVICE_ROLE_KEY    — Supabase service role key
UPSTASH_REDIS_REST_URL       — Upstash Redis URL
UPSTASH_REDIS_REST_TOKEN     — Upstash Redis token
WORKER_URL                   — cobalt instance URL (Railway) ← CURRENTLY localhost:8080
WORKER_TOKEN                 — shared secret for worker auth
```

### Railway (Cobalt)
```
API_URL                      — cobalt instance's own public URL (Railway assigns this)
# Optional: API key auth (set to match WORKER_TOKEN in Vercel)
```

### Optional (not needed for v1)
```
LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID, etc. — payment
R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET — large file staging
```
