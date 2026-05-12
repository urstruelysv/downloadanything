---
label: ready-for-agent
---

# Enforce verified Cobalt platforms as the supported-platform source of truth

Status: ready-for-agent

## What to build

Once live Cobalt verification is complete, the app should have one source of truth for which platforms are actually supported in production. Platforms that have not passed the live Cobalt extract and download flow should be hidden from UI copy and rejected by the backend before any Cobalt call is attempted.

This keeps the product promise aligned with reality: if the app advertises a platform, the production flow should work for that platform.

## Acceptance criteria

- [ ] There is a single verified-platform source of truth used by both UI-facing platform lists and backend URL handling.
- [ ] `supportedPlatforms()` returns only platforms verified against the live Cobalt backend.
- [ ] Backend URL handling rejects unverified platforms with `unsupported_platform` before calling Cobalt.
- [ ] Production-facing UI copy and platform sections do not list unverified platforms.
- [ ] Tests cover at least one known-but-unverified platform being hidden and rejected.
- [ ] Generic image/direct-file URLs are rejected for v1 with `unsupported_platform` or `invalid_url`.

## Blocked by

- `.scratch/v1-ship/issues/05-test-all-platforms.md`

## Comments

- 2026-05-12: Decision confirmed in grill session: hiding failed platforms only in UI is not enough; backend detection must enforce the same verified support list.
- 2026-05-12: Decision confirmed in grill session: generic image/direct-file URLs are out of scope for v1 and should be rejected rather than sent to Cobalt.
