---
label: ready-for-agent
---

# Verify Cobalt extraction, tunnel download, format correctness, and speed

Status: ready-for-agent

## What to build

Prove the core v1 downloader path against the live Cobalt backend. The main product promise is not login, history, or pricing; it is that a user can paste a supported URL, get truthful format options, download the selected file through the Cobalt tunnel/redirect path, and receive the file quickly enough to feel usable.

This issue should identify and fix any mismatch between what the UI says a format is and what Cobalt actually returns.

## Acceptance criteria

- [ ] For at least one verified video platform, paste -> extract -> preview shows real metadata from live Cobalt.
- [ ] Selecting `1080p`, `720p`, `480p`, or audio requests the matching Cobalt format parameters.
- [ ] The downloaded file's extension and content type match the selected format closely enough for the browser/device to open it.
- [ ] Cobalt `tunnel`, `redirect`, `picker`, and `local-processing` responses are handled intentionally, with unsupported cases converted to user-friendly errors.
- [ ] Download response headers include a safe filename and useful content type when Cobalt/source provides them.
- [ ] The UI does not advertise quality options that live Cobalt cannot reliably honor for that content type.
- [ ] Extract and download timings are recorded manually for the test URLs, with obviously slow paths noted as follow-up bugs.
- [ ] Failures never show raw Cobalt/source errors to the user.

## Blocked by

- `.scratch/v1-ship/issues/01-deploy-cobalt-railway.md`

## Comments

- 2026-05-12: Decision confirmed in grill session: the main focus is extraction logic, Cobalt tunnel/download behavior, correct formats, and speed. Account/history/payment work is secondary to this path.
- 2026-05-12: TDD slice completed locally for Cobalt response handling. `local-processing` is now rejected at extract and download time instead of returning partial tunnels; picker video items now map to direct original item downloads instead of fake quality presets; API extraction failures expose stable error codes without leaking internal messages. Full test suite and typecheck pass. Live Cobalt verification is still pending after Railway deployment.
