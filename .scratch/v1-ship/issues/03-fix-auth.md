---
label: ready-for-agent
---

# Fix broken auth flow

## What
Diagnose and fix the Supabase auth flow (Google OAuth + magic link). Code looks structurally correct — likely a Supabase dashboard config issue or cookie handling edge case.

## Steps to diagnose
1. Run dev server, open browser, go to /login
2. Try Google sign-in — check browser console and network tab
3. Try magic link — check if email arrives, check callback redirect
4. Check Supabase dashboard: Site URL, Redirect URLs, OAuth provider config
5. Check middleware cookie handling

## Acceptance
- Google OAuth sign-in works end-to-end
- Magic link sign-in works end-to-end
- Auth state persists across page refreshes
- NavAuth in hero shows correct state (signed in vs signed out)
- Account page loads for signed-in users
