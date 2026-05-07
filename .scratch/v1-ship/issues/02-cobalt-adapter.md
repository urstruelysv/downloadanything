---
label: ready-for-agent
---

# Build cobalt response adapter in lib/extraction

## What
Modify `lib/extraction/index.ts` to call cobalt's API instead of the yt-dlp worker. Map cobalt's response format to our `ExtractResult` type.

## Why
Cobalt's API returns a different response shape than our yt-dlp worker. The extraction layer needs an adapter to translate.

## Acceptance
- `extract()` calls cobalt and returns a valid `ExtractResult`
- `download()` handles cobalt's direct URLs correctly
- Retry logic preserved
- ExtractError thrown on cobalt failures with correct error codes
- Unit test for the adapter mapping
