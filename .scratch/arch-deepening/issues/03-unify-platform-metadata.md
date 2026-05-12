# 03 — Unify platform metadata into single registry

Status: completed

## Problem

"Platform" metadata scattered across three files:
- `lib/platform/index.ts` — detection rules, content rules
- `components/site/downloader/constants.ts` — labels, colors
- `components/site/platforms.tsx` — icon components

Adding a platform requires editing three files with no type enforcement.

## Solution

Deepen `PLATFORM_REGISTRY` in `lib/platform/index.ts` to include display metadata (label, color). `constants.ts` consumes from registry instead of maintaining a parallel map. Type safety ensures a new platform can't be partially defined.

## Files

- `lib/platform/index.ts`
- `components/site/downloader/constants.ts`
- `components/site/platforms.tsx`

## Acceptance

- [ ] `PLATFORM_REGISTRY` is the single source for label + color
- [ ] `constants.ts` derives platform display from registry
- [ ] Adding a platform is one-file change (type error if incomplete)
- [ ] Tests verify registry completeness
