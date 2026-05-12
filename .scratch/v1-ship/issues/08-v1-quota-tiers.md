---
label: ready-for-agent
---

# Set v1 quota tiers for anonymous and logged-in free users

Status: completed

## What to build

The v1 free product should give anonymous users a small daily download allowance and give logged-in free users a slightly better allowance plus account benefits. Paid plans remain coming soon.

The intended v1 quota model is:

```txt
Anonymous: 4 downloads/day by IP
Logged-in free user: 5 downloads/day by user ID
Subscribed: not sold in v1; coming soon
```

Logged-in free account benefits are: the higher daily limit, account page access, session persistence, and any existing short-term download history the app already supports.

## Acceptance criteria

- [x] Anonymous users can download up to 4 files/day by IP.
- [x] The 5th anonymous download attempt returns `quota_exceeded`.
- [x] Logged-in free users can download up to 5 files/day by user ID.
- [x] The 6th logged-in free download attempt returns `quota_exceeded`.
- [x] Remaining-download display is correct for both anonymous and logged-in free users.
- [x] Login, account, downloader, pricing, and FAQ copy describe the v1 limits consistently.
- [x] Pro/unlimited remains marked as coming soon and is not presented as an active paid purchase.
- [x] Tests cover anonymous and logged-in free limits separately.

## Blocked by

None - can start immediately.

## Comments

- 2026-05-12: Decision confirmed in grill session: anonymous gets 4/day; logged-in free gets 5/day and lightweight account benefits; paid subscriptions are delayed.
- 2026-05-12: Implemented via TDD. Added quota tests for anonymous and logged-in free daily limits; moved v1 quota numbers to shared constants; updated downloader, login, account, pricing, FAQ, hero, metadata, and quota error copy; removed active checkout CTAs from pricing/account surfaces.
