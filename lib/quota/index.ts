import { redis } from "@/lib/quota/redis";

export type Plan = "free" | "subscribed";

export type QuotaResult = {
  allowed: boolean;
  remaining: number;
  plan: Plan;
  reason?: "quota_exceeded" | "rate_limited";
};

const DAILY_LIMIT = 5;
const RATE_PER_SEC = 1;

function todayKey(prefix: string, id: string): string {
  const d = new Date().toISOString().slice(0, 10);
  return `quota:${prefix}:${id}:${d}`;
}

async function rateLimit(ip: string): Promise<boolean> {
  const r = redis();
  const key = `rate:${ip}:${Math.floor(Date.now() / 1000)}`;
  const n = await r.incr(key);
  if (n === 1) await r.expire(key, 2);
  return n <= RATE_PER_SEC;
}

async function checkDailyQuota(
  prefix: string,
  id: string,
): Promise<{ allowed: boolean; remaining: number }> {
  const r = redis();
  const key = todayKey(prefix, id);
  const n = await r.incr(key);
  if (n === 1) await r.expire(key, 60 * 60 * 24);
  const remaining = Math.max(0, DAILY_LIMIT - n);
  return { allowed: n <= DAILY_LIMIT, remaining };
}

export async function checkAnon(ip: string): Promise<QuotaResult> {
  if (!(await rateLimit(ip))) {
    return { allowed: false, remaining: 0, plan: "free", reason: "rate_limited" };
  }
  const { allowed, remaining } = await checkDailyQuota("anon", ip);
  if (!allowed) {
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
    return { allowed: true, remaining: Infinity, plan };
  }
  const { allowed, remaining } = await checkDailyQuota("user", userId);
  if (!allowed) {
    return { allowed: false, remaining: 0, plan, reason: "quota_exceeded" };
  }
  return { allowed: true, remaining, plan };
}
