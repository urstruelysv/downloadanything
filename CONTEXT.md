# DownloadAnything

Media download web app. Paste a link from any major platform, pick a format, download the file. No ads, no watermarks, no nonsense.

## v1 Definition (agreed 2026-05-08)

**A user can:** paste a URL from any supported platform, see format options, pick one, download the file. Optionally sign in with Google or magic link. Free tier: 5 downloads/day.

**"Professional" means:** no raw errors ever reach the user, smooth state transitions in the download flow, works on mobile. Visual polish is post-launch.

**Payments:** "Coming soon" badge on pricing. Skip Lemon Squeezy integration. If users show up, wire payments then.

**Speed:** Nice-to-have, not blocking.

## Stack

| Layer | Tech | Where |
|-------|------|-------|
| Frontend | Next.js 15, React 19, Tailwind 3, Framer Motion | Vercel (free) |
| Extraction | Cobalt v11 (self-hosted) | Railway ($5 trial) |
| Auth + DB | Supabase (magic link + Google OAuth, downloads table) | Supabase (free) |
| Rate limit + quota | Upstash Redis (1 req/sec, 5 downloads/day free) | Upstash (free) |
| File staging | Cloudflare R2 (presigned URLs for large files) | R2 (likely unused with Cobalt) |

## Architecture

```
Browser --> Vercel (Next.js 15)
              |-- POST /api/extract  --> Cobalt (Railway) --> platform APIs
              |   (auth + quota check)   returns metadata + formats
              |
              |-- POST /api/download --> Cobalt (Railway) --> media bytes
              |   (quota consume)        stream to browser
              |
              |-- POST /api/me       --> user + plan
              |-- GET  /auth/callback --> Supabase OAuth redirect
              |-- GET  /login        --> sign-in page
              |-- GET  /account      --> history + plan

Cobalt (Railway):
  POST /   --> extract or download media from source platform
  GET  /   --> health + version info
```

## Supported Platforms

youtube, instagram, tiktok, twitter/x, facebook, reddit, pinterest, vimeo, soundcloud

Platform detection via regex in `lib/platform/index.ts`. Each platform has host patterns, content type rules, display metadata (label, color, gradient).

**Reality check:** Cobalt coverage per platform is unverified. Must test each one against a running instance. Drop any platform from the UI that doesn't work reliably.

## Code Layout

```
app/
  api/extract/route.ts       POST { url } --> ExtractResult + quota
  api/download/route.ts      POST { url, formatId } --> file stream
  api/me/route.ts            GET --> user + plan
  api/checkout/route.ts      Lemon Squeezy (disabled for v1)
  auth/callback/route.ts     OAuth redirect handler
  login/page.tsx             Sign-in page
  account/page.tsx           History + plan page
  page.tsx                   Landing (hero + downloader modal)

components/site/
  downloader/                Decomposed modal (5 views + hook + types)
    index.tsx                Orchestrator
    use-extraction.ts        State machine: paste -> extract -> preview -> download -> done
    paste-view.tsx           URL input
    spinner-view.tsx         Loading
    preview-view.tsx         Thumbnail + format grid + download button
    done-view.tsx            Success
    error-view.tsx           User-friendly error
  hero.tsx                   Landing hero + nav
  sections.tsx               Features, pricing, FAQ

lib/
  extraction/
    cobalt.ts                Cobalt API client, format encoding, error mapping (229 LOC)
    adapter.ts               ExtractionAdapter interface + registry
    cobalt-adapter.ts        Cobalt adapter implementation
    index.ts                 Orchestrator: extract() + download() via adapter registry
  platform/index.ts          URL detection, SSRF validation, platform registry
  auth/
    supabase-server.ts       getCurrentUser, getUserPlan, supabaseService
    supabase-browser.ts      Browser client singleton
  http/
    with-api.ts              Route middleware: chains auth -> quota -> URL validation
    with-auth.ts             Auth middleware layer (extracts user + plan)
    with-quota.ts            Quota middleware layer (checks rate limit + daily quota)
    errors.ts                jsonError() helper
    ip.ts                    Client IP extraction
  quota/
    index.ts                 checkAnon, checkUser, consumeAnon, consumeUser
    redis.ts                 Upstash client
  logging/downloads.ts       logDownload() -> Supabase downloads table
  billing/lemonsqueezy.ts    (disabled for v1)
  storage/r2.ts              R2 presigned URLs (likely unused with Cobalt)

shared/
  types.ts                   Platform, ContentType, Format, ExtractResult, ErrorCode
  errors.ts                  ExtractError class + ERROR_LABELS map

hooks/use-auth.ts            Client-side auth hook
middleware.ts                Supabase session refresh on every request
```

## Key Design Decisions

**Adapter pattern for extraction.** `ExtractionAdapter` interface with `ownsFormat()`, `extract()`, `download()`. Registry dispatches by format ID prefix. Currently only `cobaltAdapter`. Designed so a yt-dlp adapter can plug in later without touching the orchestrator.

**Format ID encoding.** `cobalt:auto:1080`, `cobalt:audio:mp3:320`. Encodes Cobalt request params into the format ID. Decoded at download time. Avoids storing ephemeral tunnel URLs between extract and download steps.

**Middleware composition.** `withAuth` -> `withQuota` -> handler. Each layer adds typed context. `withApi` chains them. Routes like `/api/me` can use `withAuth` alone.

**Error codes, not messages.** 9 error codes (`invalid_url`, `unsupported_platform`, `unavailable`, `quota_exceeded`, `rate_limited`, `auth_required`, `degraded`, `network`, `internal`). Mapped to user-friendly labels in `ERROR_LABELS`. UI never shows raw errors.

**Cobalt probe on extract.** One call to Cobalt per extract (videoQuality: 720) to validate URL. Returns predefined format presets based on content type. Actual quality selection happens at download time.

## Local Development

```bash
npm run dev:up    # starts Cobalt (Docker) + Next.js dev server
```

Requires Docker running. Cobalt on port 9000, Next.js on port 3000. Supabase and Upstash are remote (free tier credentials in `.env.local`).

## Env Vars

### Vercel (production)
```
NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
WORKER_URL (Railway cobalt URL), WORKER_TOKEN (UUID from cobalt keys.json)
```

### Railway (Cobalt)
```
API_URL (Railway public URL), API_AUTH_REQUIRED=1, API_KEY_URL=file:///keys.json
```

### Local (.env.local)
```
WORKER_URL=http://localhost:9000, WORKER_TOKEN= (empty, no auth locally)
All Supabase + Upstash credentials point to real free-tier instances.
```

## Test Suite

58 tests across 9 files. All pass. Covers:
- Cobalt format encode/decode + response mapping (14 tests)
- Adapter registry dispatch
- Platform URL detection + content type rules
- Auth + quota middleware composition
- Download logging
- Error label exhaustiveness
- ExtractError class

No integration tests against real Cobalt. Browser testing is the primary verification method.

## Domain Vocabulary

| Term | Meaning |
|------|---------|
| Platform | Source site (youtube, instagram, tiktok, twitter, etc.) |
| ContentType | What URL points to (video, photo, carousel, audio, playlist, unknown) |
| ExtractResult | Metadata + available formats from extraction backend |
| Format | Downloadable variant: formatId + quality + ext + delivery |
| Delivery | How file reaches user: `direct` (all Cobalt downloads) |
| ErrorCode | One of 9 codes mapped to user-friendly labels |
| Cobalt | Open-source extraction service, self-hosted on Railway |
| Adapter | Pluggable extraction backend interface |
