---
label: ready-for-agent
---

# Production Deployment Validation

## What to build
Validate the new architecture in the production-like environment. Ensure Neon, Better-Auth, and the extracted-and-caching worker all behave correctly.

## Acceptance criteria
- [ ] Neon DB connection is verified in Vercel
- [ ] Better-Auth session persistence is verified across domains
- [ ] Caching in Redis effectively reduces extraction time for repeat URLs
- [ ] Error handling (e.g., failed worker spawn) does not cause 500s on the API

## Blocked by
- 01-ui-auth-integration.md
