import { describe, it, expect, vi } from "vitest";
import * as extractor from "../src/extractor";
import { Readable } from "node:stream";

vi.mock("node:child_process", () => {
  return {
    spawn: vi.fn().mockReturnValue({
      stdout: new Readable({ read: () => {} }),
      stderr: new Readable({ read: () => {} }),
      on: vi.fn(),
      once: vi.fn(),
    }),
  };
});

describe("r2 bug reproduction", () => {
  it("should not crash if sizeBytes is undefined", async () => {
    const result = await extractor.runDownload("https://example.com", "best");
    expect(result.sizeBytes).toBeUndefined();
  });
});
