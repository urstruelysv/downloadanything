---
label: ready-for-agent
---

# End-to-end browser test all platforms

## What
After cobalt is deployed and adapter is built, test the full flow for every supported platform in a browser.

## Test matrix
| Platform | Test URL | Extract | Preview | Download |
|----------|----------|---------|---------|----------|
| YouTube | Any public video | | | |
| Instagram | Any public reel | | | |
| TikTok | Any public video | | | |
| X/Twitter | Any tweet with video | | | |
| Reddit | Any post with video/image | | | |
| Facebook | Any public video | | | |
| Pinterest | Any pin | | | |
| Vimeo | Any public video | | | |
| SoundCloud | Any public track | | | |

## Also test
- Error paths: private content, invalid URLs, unsupported sites
- Quota: verify "X downloads left today" displays correctly
- Rate limit: rapid-fire requests get 429
- Mobile: test on phone-width viewport
