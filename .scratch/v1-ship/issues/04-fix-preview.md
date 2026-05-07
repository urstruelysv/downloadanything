---
label: ready-for-agent
---

# Fix preview step in downloader modal

## What
Diagnose and fix the preview step. PreviewView component exists and looks correct — likely a data shape mismatch or rendering issue.

## Steps to diagnose
1. Run dev server, paste a YouTube link, let it analyze
2. Check if step transitions to "preview"
3. Check browser console for errors
4. Check if ExtractApiResponse data reaches PreviewView props correctly
5. Check if thumbnail loads (may be blocked by CORS or CSP)
6. Check if format grid renders

## Acceptance
- Thumbnail displays for extracted content
- Title and duration show correctly
- Format grid renders with all available options
- Format selection works
- Download button triggers download flow
