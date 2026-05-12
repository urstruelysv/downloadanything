# DownloadAnything v1 — Product Requirements Document

**Owner:** saivamshig404@gmail.com
**Created:** 2026-05-08
**Goal:** Ship a working media downloader that handles all supported platforms with a professional, reliable UX.

---

## What v1 IS

A free media downloader. User pastes a URL, picks a format, downloads the file. Optionally signs in. 5 downloads/day for free users.

## What v1 IS NOT

- No payments (show "Coming soon" on pricing)
- No pro-tier features (8K, playlists, batch, permanent history)
- No mobile app
- No analytics/monitoring
- No custom domain
- No visual polish beyond "clean and functional"

---

## Ship Criteria

All must be true before v1 is live:

- [ ] Cobalt running on Railway, responding to extract/download requests
- [ ] Paste -> extract -> preview -> download -> done works end-to-end in browser
- [ ] Tested against real URLs for: YouTube, Instagram, TikTok, Twitter, Reddit, Vimeo, SoundCloud
- [ ] Platforms that fail are hidden from UI (not broken in production)
- [ ] Magic link auth works (sign in, session persists, /account shows user)
- [ ] Google OAuth works (Supabase dashboard configured)
- [ ] Anonymous users get 5 downloads/day, see remaining count
- [ ] Every error shows a user-friendly message (never raw errors)
- [ ] Works on mobile (modal, input, format grid, download)
- [ ] Vercel production deployment with Railway WORKER_URL configured

---

## Execution Plan

### Phase 1: Local end-to-end (cost: $0)

Everything runs locally. Prove the product works before spending Railway budget.

| # | Task | How to verify |
|---|------|--------------|
| 1 | Start Cobalt locally | `docker compose up -d cobalt` then `curl http://localhost:9000/` returns version info |
| 2 | Test extraction against real URLs | `npm run dev`, paste YouTube URL, see format options appear |
| 3 | Test download flow | Pick a format, file downloads to disk |
| 4 | Test each platform | One URL per platform. Record which work, which fail |
| 5 | Hide broken platforms | Remove platforms from UI that Cobalt can't handle |
| 6 | Test error states | Paste invalid URL, private video, unsupported site. Verify user-friendly error |
| 7 | Test mobile | Open localhost:3000 on phone (or Chrome DevTools mobile). Modal and flow must work |

### Phase 2: Auth (cost: $0)

Fix Supabase dashboard config, test both auth flows.

| # | Task | How to verify |
|---|------|--------------|
| 1 | Enable Google OAuth in Supabase dashboard | Dashboard -> Authentication -> Providers -> Google -> Enable. Add Google Cloud OAuth client ID + secret |
| 2 | Add redirect URLs in Supabase | Dashboard -> Authentication -> URL Configuration. Add: `http://localhost:3000/auth/callback` + `https://<vercel-url>/auth/callback` |
| 3 | Set Site URL in Supabase | Same section. Set to production Vercel URL |
| 4 | Test magic link | Enter real email, receive link, click it, land on app signed in |
| 5 | Test Google OAuth | Click "Sign in with Google", complete flow, land on app signed in |
| 6 | Test session persistence | Refresh page after sign in, user still signed in |
| 7 | Test /account page | Shows user email and plan ("free") |
| 8 | Test quota display | Download something, remaining count decreases |

### Phase 3: Deploy to Railway (cost: ~$1-2 from $5 budget)

Push Cobalt to Railway. Connect Vercel to Railway.

| # | Task | How to verify |
|---|------|--------------|
| 1 | Deploy Cobalt on Railway | Railway dashboard -> New Service -> Docker image `ghcr.io/imputnet/cobalt:11`. Set `API_URL` to Railway public URL |
| 2 | Set up API key auth | Generate UUID (`uuidgen`). Create `keys.json` with that key. Set `API_AUTH_REQUIRED=1`, `API_KEY_URL=file:///keys.json` on Railway |
| 3 | Update Vercel env vars | Set `WORKER_URL` to Railway URL, `WORKER_TOKEN` to the UUID |
| 4 | Redeploy Vercel | Trigger redeploy so new env vars take effect |
| 5 | Test production end-to-end | Open Vercel URL, paste YouTube link, download a file |
| 6 | Test production auth | Sign in with Google on production URL |

### Phase 4: Polish (cost: $0)

Make it feel professional per our definition: no raw errors, smooth flow, mobile works.

| # | Task | How to verify |
|---|------|--------------|
| 1 | Audit all error paths | Trigger every ErrorCode in browser, verify user-friendly message + clear action |
| 2 | Test state transitions | Extract -> preview -> download. No flash of wrong state, no janky jumps |
| 3 | Loading states | Spinner shows during extract, progress or feedback during download |
| 4 | Mobile audit | Full flow on phone. Touch targets, scrolling, modal sizing |
| 5 | Payment "Coming soon" | Pricing section shows plans but CTA says "Coming soon" instead of checkout |
| 6 | Empty states | /account with no downloads, first visit with no URL entered |

---

## Budget

| Resource | Limit | Burn rate |
|----------|-------|-----------|
| Railway | $5 trial credit | ~$0.50-1/week for idle Cobalt container |
| Vercel | Free tier | $0 |
| Supabase | Free tier | $0 |
| Upstash | Free tier | $0 |
| R2 | Free tier (likely unused) | $0 |

**Total runway:** ~5-10 weeks on Railway trial before services pause. Enough to validate whether users show up.

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cobalt doesn't support YouTube self-hosted | Biggest platform gone | Test immediately in Phase 1. Fallback: yt-dlp adapter |
| Cobalt unreliable for some platforms | Users see errors | Test each platform. Hide broken ones. Monitor |
| Railway $5 runs out | App stops working | Pause Cobalt on Railway when not testing. Upgrade to $5/mo Hobby if users exist |
| Supabase rate limits on free tier | Auth/logging fails | Unlikely at low traffic. Upgrade if needed |
| Cobalt API changes in future versions | Extraction breaks | Pin to `ghcr.io/imputnet/cobalt:11` (major version) |

---

## What's Already Done

Code is committed and tested (58 tests, all pass):

- [x] Cobalt adapter + format encoding/decoding
- [x] Extraction adapter pattern + registry
- [x] Middleware decomposition (auth + quota layers)
- [x] Centralized download logging
- [x] Platform detection + SSRF validation for 10 platforms
- [x] Error code -> user-friendly label mapping
- [x] Supabase SSR upgrade (0.5.2 -> 0.10.3)
- [x] Decomposed downloader modal (5 views + state hook)
- [x] Docker Compose for local Cobalt
- [x] Quota system (rate limit + daily quota via Upstash)
- [x] Unified shared types and errors

## What's Blocked on External Config (not code)

- Google OAuth: enable in Supabase dashboard + Google Cloud Console
- Redirect URLs: add to Supabase dashboard
- Railway deployment: deploy Docker image + set env vars
- Vercel env vars: point WORKER_URL to Railway after deploy
