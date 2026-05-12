---
label: ready-for-agent
---

# DownloadAnything v1 Cobalt Core PRD

## Problem Statement

Production does not currently have a working extraction backend wired through `WORKER_URL`, so the main app promise is broken: a user cannot reliably paste a supported platform URL, see truthful format options, and download a playable file.

The project also has architectural drift. The v1 intent is Cobalt, but the repo still contains older custom-worker language and code. For v1, the product needs one clear path: self-hosted Cobalt as the extraction backend, verified platforms only, and a download flow that handles Cobalt response types intentionally.

## Solution

Ship a narrow, working v1 downloader backed by a self-hosted Cobalt v11 service. The app should only advertise and accept platforms that have been verified against the live Cobalt backend. It should reject generic/direct-file URLs for v1.

The core experience is:

1. User pastes a verified platform URL.
2. App validates the URL and checks quota.
3. App calls Cobalt through the extraction layer.
4. App shows real metadata and truthful format choices.
5. User selects a format.
6. App requests the selected format from Cobalt.
7. App handles Cobalt `tunnel`, `redirect`, `picker`, `local-processing`, and `error` responses intentionally.
8. Browser starts a real download with a safe filename and playable/openable content.

Speed is measured first, not optimized prematurely. A path is acceptable for v1 if it reaches preview, starts a real download, produces the selected playable/openable file, and gives clear feedback while work is happening.

## User Stories

1. As an anonymous user, I want to paste a supported platform URL, so that I can download a media file without creating an account.
2. As an anonymous user, I want unsupported URLs to be rejected clearly, so that I know the app is not broken.
3. As an anonymous user, I want only working platforms shown in the UI, so that I trust the product promise.
4. As an anonymous user, I want extraction to reach a preview instead of raw errors, so that I can understand what will download.
5. As an anonymous user, I want the preview title and thumbnail to come from the real source, so that I can confirm I pasted the right link.
6. As an anonymous user, I want format options to be truthful, so that selecting 720p or audio gives me what the label says.
7. As an anonymous user, I want the browser download to start after clicking Download, so that the app feels real and complete.
8. As an anonymous user, I want downloaded files to have useful filenames, so that I can find them after saving.
9. As an anonymous user, I want private or unavailable media to show a friendly error, so that I do not see Cobalt internals.
10. As an anonymous user, I want tunnel and redirect downloads to work without knowing what those words mean, so that the technical delivery path is invisible to me.
11. As an anonymous user, I want multi-item media to either work clearly or fail clearly, so that carousels and galleries do not half-download silently.
12. As an anonymous user, I want the app to show progress/loading while extraction or download takes time, so that I do not think it froze.
13. As an anonymous user, I want 4 downloads/day, so that the free product is usable but bounded.
14. As a logged-in free user, I want 5 downloads/day, so that signing in has a simple real benefit.
15. As a logged-in free user, I want account access and session persistence, so that my usage feels more stable.
16. As the product owner, I want paid plans marked as coming soon, so that monetization does not distract from proving the downloader.
17. As the product owner, I want Cobalt auth enabled, so that the extraction backend is not an open public service.
18. As the product owner, I want timings recorded during verification, so that speed work is based on evidence.
19. As the product owner, I want failing platforms hidden and rejected, so that production does not advertise broken capability.
20. As a maintainer, I want tests around Cobalt response handling, so that future changes do not break tunnel, redirect, picker, or local-processing behavior.

## Implementation Decisions

- v1 extraction backend is self-hosted Cobalt v11.
- Production `WORKER_URL` points to the Cobalt service root with no extra path suffix.
- Cobalt auth is enabled; the app sends the configured API key using the Cobalt-compatible authorization header.
- The custom `worker/` service is out of scope for v1 production unless a later decision reopens that architecture.
- Verified platform support is a product boundary, not just marketing copy.
- The platform source of truth should drive both UI platform lists and backend URL acceptance.
- Generic image/direct-file URLs are out of scope for v1 and should be rejected.
- The Cobalt adapter is the deep module for response normalization. It should hide Cobalt response shape differences behind the existing extraction interface.
- Cobalt `tunnel` and `redirect` responses are expected download paths.
- Cobalt `picker` responses need explicit behavior for multi-item media. If full picker support is not ready, unsupported picker cases should fail friendly rather than pretending a single format works.
- Cobalt `local-processing` responses need explicit behavior. If the app cannot merge/remux the returned tunnel streams, local-processing should be rejected with a friendly degraded/unavailable error rather than downloading partial media.
- Format choices shown in the UI must correspond to requests the app can fulfill through Cobalt.
- Speed is measured during verification. Hard optimization targets are deferred until real timings exist.
- Anonymous quota is 4 downloads/day by IP.
- Logged-in free quota is 5 downloads/day by user ID.
- Paid subscriptions and unlimited downloads are coming soon, not active v1 purchase flows.

## Testing Decisions

- Use TDD with vertical tracer bullets: one behavior test, minimal implementation, then repeat.
- Tests should verify public behavior through API routes, extraction interfaces, or user-visible outputs rather than private implementation details.
- The Cobalt response-normalization logic should have focused tests for `tunnel`, `redirect`, `picker`, `local-processing`, and `error`.
- The download path should have tests for safe filename/content headers and friendly failure mapping.
- Platform support should have tests proving a known-but-unverified platform can be hidden and rejected.
- Quota should have separate tests for anonymous 4/day and logged-in free 5/day.
- Live Cobalt verification is manual or integration-style after deployment, because external platforms are unstable.

## Out of Scope

- Custom yt-dlp/gallery-dl/ffmpeg worker production path.
- Generic direct-file/image URL downloads.
- Paid subscription launch.
- Unlimited downloads.
- Playlist, batch, 4K/8K, or permanent history as v1 blockers.
- Speed optimization before baseline timings are recorded.
- Full analytics/monitoring beyond whatever is needed to verify the core path.

## Further Notes

- The core v1 success metric is not visual polish or account depth. It is whether extraction, format selection, and download delivery work reliably for verified platforms.
- Existing account/history code may remain, but it should not block the Cobalt launch unless it breaks the core downloader path.
- Existing stale docs and issues should be aligned as the implementation progresses so future work does not confuse Cobalt v1 with the older custom-worker architecture.
