---
label: ready-for-agent
---

# Deploy Cobalt backend and wire production WORKER_URL

Status: ready-for-agent

## What to build

Production extraction should use a live Cobalt v11 service as the v1 extraction backend. The Next.js app already speaks the Cobalt API contract, so this issue is about deploying Cobalt and wiring the production environment correctly, not changing app code.

The custom `worker/` service in this repo is out of scope for v1 production unless a later issue explicitly reopens that architecture.

## Acceptance criteria

- [ ] Cobalt v11 is deployed as a Railway service.
- [ ] The Railway Cobalt root URL responds with a valid Cobalt response.
- [ ] Vercel `WORKER_URL` points to the Railway Cobalt service root, with no extra path suffix.
- [ ] If Cobalt auth is enabled, Vercel `WORKER_TOKEN` matches the Cobalt API key expected by Railway.
- [ ] Production `/api/extract` reaches Cobalt and returns preview data for one known-good YouTube URL.
- [ ] Production `/api/download` downloads one selected format from that preview.
- [ ] A failure to reach Cobalt shows the app's user-friendly degraded extraction message, not a raw server error.

## Blocked by

None - can start immediately.

## Comments

- 2026-05-12: Decision confirmed in grill session: v1 should go with Cobalt. Current production has no `WORKER_URL`, so extraction cannot work until this is deployed and wired.
