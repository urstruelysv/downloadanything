import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/auth/supabase-server", () => ({
  getCurrentUser: vi.fn(),
  getUserPlan: vi.fn(),
}));

vi.mock("@/lib/quota", () => ({
  checkAnon: vi.fn(),
  checkUser: vi.fn(),
}));

vi.mock("@/lib/http/ip", () => ({
  clientIp: vi.fn().mockReturnValue("1.2.3.4"),
}));

import { withAuth, type AuthContext } from "@/lib/http/with-auth";
import { withQuota, type QuotaContext } from "@/lib/http/with-quota";
import { getCurrentUser, getUserPlan } from "@/lib/auth/supabase-server";
import { checkAnon, checkUser } from "@/lib/quota";

function fakeReq() {
  return { headers: new Headers() } as any;
}

describe("withAuth", () => {
  afterEach(() => vi.restoreAllMocks());

  it("provides user and plan for authenticated requests", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "u1", email: "a@b.c" });
    (getUserPlan as ReturnType<typeof vi.fn>).mockResolvedValue("subscribed");

    let captured: AuthContext | null = null;
    const handler = withAuth(async (_req, ctx) => {
      captured = ctx;
      return Response.json({ ok: true });
    });

    await handler(fakeReq());
    expect(captured!.user!.id).toBe("u1");
    expect(captured!.plan).toBe("subscribed");
    expect(captured!.ip).toBe("1.2.3.4");
  });

  it("treats auth failure as anonymous with free plan", async () => {
    (getCurrentUser as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("no cookies"));

    let captured: AuthContext | null = null;
    const handler = withAuth(async (_req, ctx) => {
      captured = ctx;
      return Response.json({ ok: true });
    });

    await handler(fakeReq());
    expect(captured!.user).toBeNull();
    expect(captured!.plan).toBe("free");
  });
});

describe("withQuota", () => {
  afterEach(() => vi.restoreAllMocks());

  it("passes through when quota is allowed", async () => {
    (checkAnon as ReturnType<typeof vi.fn>).mockResolvedValue({
      allowed: true, remaining: 4, plan: "free",
    });

    let called = false;
    const handler = withQuota(async (_req, ctx) => {
      called = true;
      return Response.json({ remaining: ctx.quota.remaining });
    });

    const authCtx: AuthContext = { ip: "1.2.3.4", user: null, plan: "free" };
    const res = await handler(fakeReq(), authCtx);
    expect(called).toBe(true);
    expect(res.status).toBe(200);
  });

  it("returns 429 when quota exceeded", async () => {
    (checkAnon as ReturnType<typeof vi.fn>).mockResolvedValue({
      allowed: false, remaining: 0, plan: "free", reason: "quota_exceeded",
    });

    const handler = withQuota(async () => Response.json({ ok: true }));
    const authCtx: AuthContext = { ip: "1.2.3.4", user: null, plan: "free" };
    const res = await handler(fakeReq(), authCtx);
    expect(res.status).toBe(429);
  });

  it("uses checkUser for authenticated requests", async () => {
    (checkUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      allowed: true, remaining: Infinity, plan: "subscribed",
    });

    const handler = withQuota(async () => Response.json({ ok: true }));
    const authCtx: AuthContext = { ip: "1.2.3.4", user: { id: "u1" } as any, plan: "subscribed" };
    await handler(fakeReq(), authCtx);
    expect(checkUser).toHaveBeenCalledWith("u1", "1.2.3.4", "subscribed");
  });
});
