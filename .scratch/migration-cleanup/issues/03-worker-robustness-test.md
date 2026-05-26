---
label: ready-for-agent
---

# Test Worker Robustness

## What to build
Force yt-dlp failures (e.g., provide an unsupported/invalid URL) and verify that the worker process remains alive and healthy.

## Acceptance criteria
- [ ] Worker does not crash on spawn error
- [ ] Proper error code returned to client
- [ ] Worker logs error message to stderr but stays running

## Blocked by
- None
