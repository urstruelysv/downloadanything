import { describe, it, expect } from "vitest";
import type { ErrorCode } from "@/shared/types";
import { ERROR_LABELS } from "@/shared/errors";

const ALL_ERROR_CODES: ErrorCode[] = [
  "invalid_url",
  "unsupported_platform",
  "unavailable",
  "quota_exceeded",
  "rate_limited",
  "auth_required",
  "degraded",
  "network",
  "internal",
];

describe("ERROR_LABELS exhaustiveness", () => {
  it("has a label for every ErrorCode", () => {
    for (const code of ALL_ERROR_CODES) {
      expect(ERROR_LABELS[code]).toBeDefined();
      expect(typeof ERROR_LABELS[code]).toBe("string");
      expect(ERROR_LABELS[code].length).toBeGreaterThan(0);
    }
  });

  it("has no extra keys beyond ErrorCode", () => {
    const keys = Object.keys(ERROR_LABELS);
    expect(keys.sort()).toEqual([...ALL_ERROR_CODES].sort());
  });
});
