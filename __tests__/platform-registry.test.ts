import { describe, it, expect } from "vitest";
import type { Platform } from "@/shared/types";
import { platformDisplay, supportedPlatforms } from "@/lib/platform";

const ALL_PLATFORMS: Platform[] = [
  "youtube", "instagram", "tiktok", "twitter", "facebook",
  "reddit", "pinterest", "vimeo", "soundcloud", "generic",
];

describe("platform display metadata", () => {
  it("returns label and gradient for every Platform including generic", () => {
    for (const p of ALL_PLATFORMS) {
      const display = platformDisplay(p);
      expect(display).toBeDefined();
      expect(display.label).toBeTruthy();
      expect(display.gradient).toBeTruthy();
    }
  });

  it("returns correct labels for known platforms", () => {
    expect(platformDisplay("youtube").label).toBe("YouTube");
    expect(platformDisplay("twitter").label).toBe("Twitter / X");
    expect(platformDisplay("soundcloud").label).toBe("SoundCloud");
    expect(platformDisplay("generic").label).toBe("Source");
  });

  it("every supported platform has display metadata", () => {
    for (const p of supportedPlatforms()) {
      const display = platformDisplay(p);
      expect(display.label.length).toBeGreaterThan(0);
    }
  });
});
