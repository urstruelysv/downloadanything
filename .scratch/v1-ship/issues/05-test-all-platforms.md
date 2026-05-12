---
label: ready-for-agent
---

# Verify Cobalt platform support and hide unverified platforms

Status: ready-for-agent

## What to build

After the production Cobalt backend is deployed, verify the paste -> extract -> preview -> download flow for every platform currently advertised by the app. Only platforms that pass the live Cobalt flow should remain visible in production UI copy and platform lists.

The product promise is not "we list every possible platform"; it is "the platforms we show actually work."

## Test matrix

| Platform | Test URL | Extract | Preview | Download | Ship in UI |
|----------|----------|---------|---------|----------|------------|
| YouTube | Public video | | | | |
| Instagram | Public reel/post | | | | |
| TikTok | Public video | | | | |
| X/Twitter | Public post with video | | | | |
| Reddit | Public post with video/image | | | | |
| Facebook | Public video | | | | |
| Pinterest | Public pin | | | | |
| Vimeo | Public video | | | | |
| SoundCloud | Public track | | | | |

## Acceptance criteria

- [ ] Each advertised platform is tested against the deployed Cobalt service using at least one known-good public URL.
- [ ] The test matrix records extract, preview, and download status for each platform.
- [ ] Any platform that fails extract, preview, or download is hidden from production-facing UI until fixed.
- [ ] Unsupported or hidden platforms return a user-friendly unsupported-platform error.
- [ ] Invalid URL and private/unavailable content show user-friendly errors.
- [ ] Mobile viewport still shows the correct supported-platform list without text overflow.

## Blocked by

- `.scratch/v1-ship/issues/01-deploy-cobalt-railway.md`

## Comments

- 2026-05-12: Decision confirmed in grill session: production should show only platforms personally verified against the live Cobalt backend.
