# DownloadAnything

Paste a link → get the file. Real extraction (yt-dlp + gallery-dl + ffmpeg), no mock data, no ads, no watermarks.

Free tier: 5 downloads / day, up to 1080p, single URL.
Pro ($3.99/mo or $29/yr): unlimited, up to 8K, playlists, 50-URL batches, permanent history.

## Stack

| Concern | Choice |
| --- | --- |
| Frontend | Next.js 15 App Router (Vercel) |
| Worker | Node 24 + Hono on Railway (Docker) |
| Extraction | yt-dlp + gallery-dl + ffmpeg |
| Auth + DB | Supabase |
| Cache + rate limit + quota | Upstash Redis |
| Big-file storage | Cloudflare R2 (1 hr signed URLs) |
| Billing | Lemon Squeezy (merchant of record) |

## Architecture

```
Browser → Vercel (Next.js)
            ├── /api/extract       → metadata + format list
            ├── /api/download      → 302 direct OR R2 signed URL OR streamed bytes
            ├── /api/checkout      → Lemon Squeezy hosted checkout
            ├── /api/webhooks/lemonsqueezy → flips subscription state
            └── /api/me            → current user + plan

Vercel ↔ Railway worker (Hono):
   POST /extract  → ExtractResult JSON
   POST /download → bytes (≤50 MB) or { r2Url }
   GET  /healthz

Auth: Supabase JWT cookies (server-side verification, no middleware gate).
Quota: Upstash Redis. Anon = 5/day per IP. Free user = same per user_id. Subscribed = unlimited.
Rate limit: 1 req/sec per IP, all tiers.
SSRF: URL host allow-listed against detector before reaching the worker.
Worker auth: shared `X-Worker-Token`. Reject otherwise.
```

## Project layout

```
app/                    Next.js routes + UI
  api/
    extract/            POST { url } → ExtractResult
    download/           POST { url, formatId, directUrl? } → file or { r2Url }
    checkout/           POST { plan } → { url }
    webhooks/lemonsqueezy/  POST raw → upsert subscription
    me/                 GET → user + plan
components/site/        Marketing page + downloader modal
lib/
  platform/             URL detector (regex map)
  extract/              router + worker client
  quota/                Upstash quota + rate limit
  auth/                 Supabase server clients
  billing/              Lemon Squeezy: checkout + HMAC verify
  storage/r2.ts         Cloudflare R2 (S3 SDK)
  security/             SSRF allowlist
  http/                 small request helpers
supabase/migrations/    SQL schema (subscriptions, downloads, RLS)
worker/                 Railway Docker container (Hono + yt-dlp + gallery-dl + ffmpeg)
docs/superpowers/specs/ Design specs
```

## Local setup

Prerequisites: Bun, Docker (for the worker), and accounts on Supabase, Upstash, Cloudflare R2, Lemon Squeezy.

1. Copy env: `cp .env.example .env.local` and fill values.
2. Apply DB schema: `psql "$SUPABASE_DB_URL" -f supabase/migrations/0001_init.sql` (or paste into Supabase SQL editor).
3. Frontend:
   ```sh
   bun install
   bun run dev
   ```
4. Worker (separate terminal):
   ```sh
   cd worker
   docker build -t da-worker .
   docker run --rm -p 8080:8080 \
     -e WORKER_TOKEN=$WORKER_TOKEN \
     -e R2_ACCOUNT_ID=$R2_ACCOUNT_ID \
     -e R2_ACCESS_KEY_ID=$R2_ACCESS_KEY_ID \
     -e R2_SECRET_ACCESS_KEY=$R2_SECRET_ACCESS_KEY \
     -e R2_BUCKET=$R2_BUCKET \
     da-worker
   ```
   In `.env.local`, set `WORKER_URL=http://localhost:8080`.

## Environment

See `.env.example`. Keys split across two services:

**Vercel (Next.js)**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `WORKER_URL`, `WORKER_TOKEN`, `LEMONSQUEEZY_API_KEY`, `LEMONSQUEEZY_STORE_ID`, `LEMONSQUEEZY_VARIANT_ID_MONTHLY`, `LEMONSQUEEZY_VARIANT_ID_YEARLY`, `LEMONSQUEEZY_WEBHOOK_SECRET`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`.

**Railway (worker)**: `WORKER_TOKEN` (same as Vercel), `R2_*` (same), `PORT`.

## Security

- Worker rejects anything without `X-Worker-Token`.
- LS webhook verifies HMAC-SHA256 with `LEMONSQUEEZY_WEBHOOK_SECRET`; mismatched → 401.
- SSRF: `lib/security/url-allowlist.ts` blocks `localhost`, RFC1918, link-local, and any host not detected as a supported platform.
- Service-role Supabase key only on the server.
- R2 GETs are time-limited signed URLs (1 hr, random object key).
- LS `custom_data.user_id` is set server-side at checkout; the client cannot inject one.

## Deploy

- **Frontend → Vercel**: import the repo. Add env vars. Default Node runtime (Fluid Compute). `vercel deploy` for previews; `vercel deploy --prod` to ship.
- **Worker → Railway**: connect the repo, point service root at `worker/`, Railway auto-builds the Dockerfile. Add env. Expose `:8080`.
- **DB → Supabase**: run the migration once. RLS enforces per-user reads.
- **Webhook**: in Lemon Squeezy, add `https://YOUR_DOMAIN/api/webhooks/lemonsqueezy` with the same secret.

## Acceptance (per spec)

- All ten platform categories return real data.
- Anon blocked at 6th download in 24 h with `quota_exceeded` + upgrade CTA.
- Subscribed user can download a 4K YouTube needing audio+video merge.
- Subscribed user gets a carousel as a zip.
- LS webhook flips a user free → subscribed within ~30 s of payment.
- Cancellation flips them back at period end.
- No mock data anywhere.

## License

Private.
