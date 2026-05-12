---
label: ready-for-agent
---

# Clarify v1 monetization state

Status: ready-for-agent

## What to build

The v1 product should keep login available but delay paid subscriptions until the core Cobalt download flow is proven with real usage. Pricing may communicate future Pro intent, but users should not be able to start a real checkout from the production UI.

This keeps the app focused on proving demand before adding payment complexity.

## Acceptance criteria

- [ ] Login remains available for users who want an account.
- [ ] Anonymous users and logged-in free users both follow the v1 free quota rule.
- [ ] Pricing and plan copy clearly mark paid plans as coming soon.
- [ ] Production UI does not expose an active checkout CTA.
- [ ] Lemon Squeezy backend code may remain dormant, but no user-facing flow depends on it for v1.
- [ ] Account and download-flow copy do not promise unlimited downloads until payments are intentionally launched.

## Blocked by

None - can start immediately.

## Comments

- 2026-05-12: Decision confirmed in grill session: delay paid subscriptions until people use the core downloader; login remains in v1.
