import type { Plan, QuotaResult } from "@/lib/types";
import { redis } from "@/lib/quota/redis";

const ANON_DAILY_LIMIT = 5;
const RATE_PER_SEC = 1;

function todayKey(prefix: string, id: string): string {
  const d = new Date().toISOString().slice(0, 10);
  return `quota:${prefix}:${id}:${d}`;
}

export async function rateLimit(ip: string): Promise<boolean> {
  const r = redis();
  const key = `rate:${ip}:${Math.floor(Date.now() / 1000)}`;
  const n = await r.incr(key);
  if (n === 1) await r.expire(key, 2);
  return n <= RATE_PER_SEC;
}

export async function checkAnon(ip: string): Promise<QuotaResult> {
  if (!(await rateLimit(ip))) {
    return { allowed: false, remaining: 0, plan: "free", reason: "rate_limited" };
  }
  const r = redis();
  const key = todayKey("anon", ip);
  const n = await r.incr(key);
  if (n === 1) await r.expire(key, 60 * 60 * 24);
  const remaining = Math.max(0, ANON_DAILY_LIMIT - n);
  if (n > ANON_DAILY_LIMIT) {
    return { allowed: false, remaining: 0, plan: "free", reason: "quota_exceeded" };
  }
  return { allowed: true, remaining, plan: "free" };
}

export async function checkUser(
  userId: string,
  ip: string,
  plan: Plan,
): Promise<QuotaResult> {
  if (!(await rateLimit(ip))) {
    return { allowed: false, remaining: 0, plan, reason: "rate_limited" };
  }
  if (plan === "subscribed") {
    return { allowed: true, remaining: Number.POSITIVE_INFINITY, plan };
  }
  const r = redis();
  const key = todayKey("user", userId);
  const n = await r.incr(key);
  if (n === 1) await r.expire(key, 60 * 60 * 24);
  const remaining = Math.max(0, ANON_DAILY_LIMIT - n);
  if (n > ANON_DAILY_LIMIT) {
    return { allowed: false, remaining: 0, plan, reason: "quota_exceeded" };
  }
  return { allowed: true, remaining, plan };
}
