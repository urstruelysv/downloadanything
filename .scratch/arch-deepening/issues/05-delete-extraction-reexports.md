# 05 — Delete extraction re-export pass-throughs

Status: completed

## Problem

`lib/extraction/types.ts` (8 lines) and `lib/extraction/errors.ts` (1 line) exist solely to re-export from `shared/`. Zero implementation — interface equals implementation. Fail deletion test: removing them concentrates nothing, just removes a hop.

## Solution

Delete both files. Have `lib/extraction/index.ts` and consumers import directly from `@/shared/`. Two fewer files, zero behavior change.

## Files

- `lib/extraction/types.ts` (delete)
- `lib/extraction/errors.ts` (delete)
- `lib/extraction/index.ts` (update imports)
- Any consumers importing from `@/lib/extraction/types` or `@/lib/extraction/errors`

## Acceptance

- [ ] `lib/extraction/types.ts` deleted
- [ ] `lib/extraction/errors.ts` deleted
- [ ] All imports updated to `@/shared/types` or `@/shared/errors`
- [ ] Typecheck passes
- [ ] All tests pass
