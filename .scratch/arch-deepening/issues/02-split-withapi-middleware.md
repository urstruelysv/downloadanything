# 02 — Split withApi middleware into composable layers

Status: completed

## Problem

`lib/http/with-api.ts` (116 lines) does auth, plan lookup, quota check, URL validation, and error handling in one function. Its interface is roughly as complex as its implementation. Testing any handler wrapped in `withApi` requires mocking Supabase, Redis, and extraction errors simultaneously. Routes like `app/api/me/route.ts` bypass it entirely because they only need auth.

## Solution

Decompose into composable middleware: `withAuth()`, `withQuota()`, `withUrl()`. Each becomes a deeper module with a small interface. Routes compose only what they need. Keep `withApi` as a convenience that composes all three.

## Files

- `lib/http/with-api.ts`
- `lib/http/with-auth.ts` (new)
- `lib/http/with-quota.ts` (new)
- `lib/http/with-url.ts` (new)

## Acceptance

- [ ] Three independent middleware functions, each testable alone
- [ ] `withApi` rewritten as composition of the three
- [ ] `app/api/me/route.ts` uses `withAuth` instead of raw Supabase calls
- [ ] Tests for each middleware in isolation
