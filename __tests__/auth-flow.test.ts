import { describe, it, expect, vi } from "vitest";

vi.mock("../lib/db/index", () => ({
  db: {}, // Mocked db
}));

import { auth } from "../lib/auth/better-auth";

describe("better-auth integration", () => {
  it("should have google provider configured", () => {
    expect(auth.options.socialProviders?.google).toBeDefined();
    expect(auth.options.emailAndPassword?.enabled).toBe(true);
  });
});
