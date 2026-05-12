# 04 — Error code mapping with compile-time exhaustiveness

Status: completed

## Problem

`ErrorCode` is a string union in `shared/types.ts`. Cobalt error mapping in `cobalt.ts` produces these codes. User-facing labels in `constants.ts` consume them. No exhaustiveness check — adding a new error code compiles fine even if `labelForError()` has no entry, resulting in silent "Unknown error" at runtime.

## Solution

Make `ErrorCode` → label mapping a `Record<ErrorCode, string>` so TypeScript enforces exhaustiveness. The error module owns both code definitions and the guarantee every code has a message.

## Files

- `shared/types.ts`
- `shared/errors.ts`
- `components/site/downloader/constants.ts`
- `lib/extraction/cobalt.ts`

## Acceptance

- [ ] `ERROR_LABELS` is typed as `Record<ErrorCode, string>`
- [ ] Adding a new ErrorCode without a label causes a compile error
- [ ] Tests verify every ErrorCode has a label
- [ ] `mapCobaltError` return type is `ErrorCode` (already is, verify)
