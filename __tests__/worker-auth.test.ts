import { describe, it, expect } from "vitest";
import { createWorkerApp } from "../worker/src/app";

const TEST_TOKEN = "test-secret-token";

function app() {
  return createWorkerApp(TEST_TOKEN);
}

describe("worker auth middleware", () => {
  it("accepts Authorization: Bearer <token>", async () => {
    const res = await app().request("/healthz", {});
    expect(res.status).toBe(200);

    const res2 = await app().request("/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TEST_TOKEN}`,
      },
      body: JSON.stringify({ url: "https://www.youtube.com/watch?v=test" }),
    });
    expect(res2.status).not.toBe(401);
  });

  it("accepts x-worker-token header", async () => {
    const res = await app().request("/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-worker-token": TEST_TOKEN,
      },
      body: JSON.stringify({ url: "https://www.youtube.com/watch?v=test" }),
    });
    expect(res.status).not.toBe(401);
  });

  it("rejects missing token", async () => {
    const res = await app().request("/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://www.youtube.com/watch?v=test" }),
    });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
  });

  it("rejects wrong token", async () => {
    const res = await app().request("/extract", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer wrong-token",
      },
      body: JSON.stringify({ url: "https://www.youtube.com/watch?v=test" }),
    });
    expect(res.status).toBe(401);
  });

  it("allows /healthz without auth", async () => {
    const res = await app().request("/healthz");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
