# DownloadAnything — Architecture Context

## What this is
Media download web app. Paste link from YouTube/Instagram/TikTok/X/Facebook/Reddit/Pinterest/Vimeo/SoundCloud → extract metadata → pick format → download file.

## System layout

```
Next.js app (Vercel)          Hono worker (separate deploy)
├── app/                      worker/
│   ├── page.tsx              ├── src/server.ts      (Hono HTTP)
│   ├── api/extract/route.ts  ├── src/extractor.ts   (yt-dlp wrapper)
│   └── api/download/route.ts ├── src/r2.ts          (R2 upload)
├── components/site/          └── src/types.ts       (re-exports shared)
├── lib/
│   ├── platform/index.ts     (URL detection, platform registry)
│   ├── extraction/           (server-side extract/download orchestration)
│   ├── auth/                 (Supabase auth)
│   ├── quota/                (Upstash rate limiting)
│   └── http/with-api.ts      (route middleware)
└── shared/                   (canonical types, copied to worker via sync)
    ├── types.ts
    └── errors.ts
```

## Shared types strategy
Canonical source: `shared/types.ts` and `shared/errors.ts` (self-contained, no imports).
- App imports via `@/shared/types` (Next.js path alias).
- Worker copies via `npm run sync-shared` (prebuild script: `cp ../shared/*.ts src/shared-*.ts`).
- `lib/extraction/types.ts` and `lib/extraction/errors.ts` re-export from shared.
- `lib/platform/index.ts` imports `Platform`/`ContentType` from shared.
- Worker's `src/types.ts` re-exports from `./shared-types.js`.
- Worker's `extractor.ts` uses `ExtractError` (was `WorkerError`, unified).

## Downloader modal decomposition

Old: single 724-line `components/site/downloader-modal.tsx` (god component).

New: `components/site/downloader/`

| File | Role |
|------|------|
| `types.ts` | `DownloadRecord`, `Step`, `ExtractApiResponse` (extends shared `ExtractResult` + `remaining?`, `plan?`) |
| `constants.ts` | `PLATFORM_LABEL`, `PLATFORM_COLOR`, `fmtDuration`, `fmtBytes`, `labelForError` |
| `use-extraction.ts` | Hook: all state, API calls, AbortController lifecycle |
| `paste-view.tsx` | URL input + paste-from-clipboard |
| `spinner-view.tsx` | Reused for "analyzing" and "downloading" steps |
| `preview-view.tsx` | Thumbnail card, format grid, download button |
| `done-view.tsx` | Success state |
| `error-view.tsx` | Error display + quota upsell |
| `index.tsx` | Thin orchestrator, re-exports `DownloadRecord` |

Consumers:
- `app/page.tsx` → `@/components/site/downloader`
- `components/site/hero.tsx` → `./downloader/types` (DownloadRecord)

## Remaining work (as of 2026-05-07)

1. **Delete** old `components/site/downloader-modal.tsx`
2. **Typecheck app**: `npm run typecheck`
3. **Typecheck worker**: `cd worker && npm run build`
4. **Browser test**: dev server → paste → analyze → preview → download → done + error paths
5. **Optional**: add vitest test validating `shared/*.ts` matches `worker/src/shared-*.ts`

## Domain vocabulary

| Term | Meaning |
|------|---------|
| Platform | Source site (youtube, instagram, etc. + "generic") |
| ContentType | What the URL points to (video, photo, carousel, audio, playlist, unknown) |
| Delivery | How file reaches user: `direct` (redirect to source), `worker-stream`, `worker-r2` (merged via R2) |
| ExtractResult | Metadata + available formats from extraction |
| ExtractApiResponse | ExtractResult + quota info (`remaining`, `plan`) added by API route |
| Format | Single downloadable variant (quality + ext + delivery method) |
| ExtractError | Unified error class (code + httpStatus), used by both app and worker |
| ErrorCode | Typed union: invalid_url, unsupported_platform, unavailable, quota_exceeded, rate_limited, auth_required, degraded, network, internal |

## Stack
- Next.js 15, React 19, Tailwind CSS 3
- Supabase (auth + DB logging)
- Upstash Redis (rate limiting)
- Hono worker (yt-dlp extraction, separate deploy)
- Cloudflare R2 (large file staging)
- Vitest (testing)
