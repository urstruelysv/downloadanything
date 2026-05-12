# 01 — Centralize download logging

Status: completed

## Problem

Download tracking is implemented inline in two API routes with different schemas:
- `app/api/extract/route.ts` logs `{ format: null, bytes: null, status: "success" }`
- `app/api/download/route.ts` has `recordDownload()` logging with a format ID

Both fire-and-forget insert into the `downloads` table via raw Supabase calls. The Supabase table schema is encoded as string literals in two places. No shared type, no shared function, no seam.

## Solution

Extract a deep `DownloadLog` module (`lib/logging/downloads.ts`) — a single function behind one interface that owns the schema, the insert, and the error handling. Both routes call it with a typed record. The module absorbs the Supabase dependency.

## Files

- `app/api/extract/route.ts`
- `app/api/download/route.ts`
- `lib/logging/downloads.ts` (new)
- `shared/types.ts` (add DownloadLogEntry type)

## Acceptance

- [ ] Single `logDownload()` function used by both routes
- [ ] Typed `DownloadLogEntry` in shared types
- [ ] Both routes produce identical schema on insert
- [ ] Tests verify log entry shape and error handling
