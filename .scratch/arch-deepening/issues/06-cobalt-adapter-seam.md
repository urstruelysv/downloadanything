# 06 — Make cobalt adapter a proper seam with adapter dispatch

Status: completed

## Problem

The cobalt format ID scheme (`cobalt:auto:1080`) is defined in `cobalt.ts` but leaks into `index.ts` which calls `decodeCobaltFormat()` to route download paths. The orchestrator knows cobalt's internal encoding. If a second adapter existed (yt-dlp fallback), the orchestrator would need to parse both ID schemes.

## Solution

Make the orchestrator dispatch on a registered adapter pattern. Each adapter owns its format IDs and download function. The orchestrator asks "which adapter owns this format ID?" rather than parsing prefixes.

## Files

- `lib/extraction/index.ts`
- `lib/extraction/cobalt.ts`
- `lib/extraction/adapter.ts` (new — adapter interface)

## Acceptance

- [ ] `ExtractionAdapter` interface defined (extract, download, ownsFormat)
- [ ] Cobalt adapter implements the interface
- [ ] Orchestrator dispatches via adapter registry, not prefix parsing
- [ ] Adding a new adapter requires no changes to orchestrator
- [ ] Tests verify adapter dispatch
