---
label: ready-for-agent
---

# Deploy self-hosted Cobalt on Railway

## What
Deploy cobalt (github.com/imputnet/cobalt) as a Docker service on Railway. This replaces the yt-dlp worker as the extraction backend.

## Why
yt-dlp on a server only works for YouTube and Vimeo. All other platforms (Instagram, TikTok, X, Reddit, SoundCloud, Pinterest, Facebook) block server IPs or require auth cookies. Cobalt already solved this.

## Acceptance
- Cobalt instance running on Railway
- Health endpoint responds
- Extraction works for Instagram, TikTok, X, Reddit, SoundCloud, Pinterest, Vimeo
- YouTube support verified (may or may not work in cobalt)
- WORKER_URL env var updated in Vercel to point to Railway cobalt instance
