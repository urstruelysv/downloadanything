---
label: ready-for-human
---

# Verify Better-Auth Flow

## What to build
Verify the end-to-end Better-Auth sign-in flow (Google OAuth). Ensure sessions are correctly persisted in the Neon database.

## Acceptance criteria
- [ ] Google OAuth sign-in redirects to /account
- [ ] Session is created in `session` table
- [ ] User is created in `user` table
- [ ] /account page correctly identifies the authenticated user

## Blocked by
- None
