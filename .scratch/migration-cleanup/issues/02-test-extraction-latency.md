---
label: ready-for-agent
---

# Test Extraction Latency and Caching

## What to build
Benchmark extraction speed for YouTube, Instagram, and TikTok URLs. Verify that repeat requests are served from Redis cache.

## Acceptance criteria
- [ ] First request latency verified for target platforms
- [ ] Second request (10 mins later) served from cache (verify by inspecting Redis)
- [ ] Multi-quality options displayed in the UI

## Blocked by
- None
