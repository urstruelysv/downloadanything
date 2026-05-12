import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Store = Map<string, number>;

const store: Store = new Map();

vi.mock("@/lib/quota/redis", () => ({
  redis: () => ({
    get: async <T>(key: string): Promise<T | null> => {
      return (store.get(key) as T | undefined) ?? null;
    },
    incr: async (key: string): Promise<number> => {
      const next = (store.get(key) ?? 0) + 1;
      store.set(key, next);
      return next;
    },
    expire: async () => 1,
  }),
}));

import { consumeAnon, consumeUser } from "@/lib/quota";

describe("quota", () => {
  beforeEach(() => {
    store.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-12T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows four anonymous downloads per day by IP", async () => {
    await expect(consumeAnon("1.2.3.4")).resolves.toMatchObject({
      allowed: true,
      remaining: 3,
    });
    await consumeAnon("1.2.3.4");
    await consumeAnon("1.2.3.4");
    await expect(consumeAnon("1.2.3.4")).resolves.toMatchObject({
      allowed: true,
      remaining: 0,
    });
    await expect(consumeAnon("1.2.3.4")).resolves.toMatchObject({
      allowed: false,
      reason: "quota_exceeded",
      remaining: 0,
    });
  });

  it("allows five logged-in free downloads per day by user ID", async () => {
    await expect(consumeUser("user-1", "free")).resolves.toMatchObject({
      allowed: true,
      remaining: 4,
    });
    await consumeUser("user-1", "free");
    await consumeUser("user-1", "free");
    await consumeUser("user-1", "free");
    await expect(consumeUser("user-1", "free")).resolves.toMatchObject({
      allowed: true,
      remaining: 0,
    });
    await expect(consumeUser("user-1", "free")).resolves.toMatchObject({
      allowed: false,
      reason: "quota_exceeded",
      remaining: 0,
    });
  });
});
