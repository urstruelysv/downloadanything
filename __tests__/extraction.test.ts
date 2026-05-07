import { describe, it, expect } from "vitest";
import { ExtractError } from "@/lib/extraction/errors";

describe("ExtractError", () => {
  it("stores code and httpStatus", () => {
    const err = new ExtractError("unavailable", 404, "Video not found");
    expect(err.code).toBe("unavailable");
    expect(err.httpStatus).toBe(404);
    expect(err.message).toBe("Video not found");
    expect(err.name).toBe("ExtractError");
  });

  it("uses code as message when no message provided", () => {
    const err = new ExtractError("degraded", 503);
    expect(err.message).toBe("degraded");
  });

  it("is an instance of Error", () => {
    const err = new ExtractError("internal", 500);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ExtractError);
  });
});
