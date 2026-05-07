import { NextRequest, NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { getCurrentUser, getUserPlan } from "@/lib/auth/supabase-server";
import { checkAnon, checkUser } from "@/lib/quota";
import { clientIp } from "@/lib/http/ip";
import { jsonError } from "@/lib/http/errors";
import { validateUrl, detect } from "@/lib/platform";
import type { Plan, QuotaResult } from "@/lib/quota";
import { ExtractError } from "@/lib/extraction";

export type ApiContext = {
  ip: string;
  user: User | null;
  plan: Plan;
  quota: QuotaResult;
};

export type UrlApiContext = ApiContext & {
  url: string;
  platform: ReturnType<typeof detect>;
  body: Record<string, unknown>;
};

type HandlerFn<C> = (req: NextRequest, ctx: C) => Promise<Response>;

type ApiOptions = {
  requireAuth?: boolean;
  requireUrl?: boolean;
  urlField?: string;
};

export function withApi<O extends ApiOptions>(
  options: O,
  handler: HandlerFn<O["requireUrl"] extends true ? UrlApiContext : ApiContext>,
) {
  return async (req: NextRequest): Promise<Response> => {
    try {
      const ip = clientIp(req);

      let user: User | null = null;
      try {
        user = await getCurrentUser();
      } catch {
        // auth failure — treat as anonymous
      }

      if (options.requireAuth && !user) {
        return jsonError("auth_required", 401);
      }

      let plan: Plan = "free";
      if (user) {
        plan = await getUserPlan(user.id);
      }

      let quota: QuotaResult;
      if (user) {
        quota = await checkUser(user.id, ip, plan);
      } else {
        quota = await checkAnon(ip);
      }
      if (!quota.allowed) {
        return jsonError(quota.reason ?? "quota_exceeded", 429, {
          upgradeUrl: "/pricing",
        });
      }

      let ctx: any = { ip, user, plan, quota };

      if (options.requireUrl) {
        let body: any;
        try {
          body = await req.json();
        } catch {
          return jsonError("invalid_url", 400);
        }

        const field = options.urlField ?? "url";
        const rawUrl = body?.[field];
        if (!rawUrl || typeof rawUrl !== "string") {
          return jsonError("invalid_url", 400);
        }

        const validation = validateUrl(rawUrl);
        if (!validation.ok) {
          return jsonError(validation.reason, 400);
        }

        const det = detect(rawUrl);
        if (!det) {
          return jsonError("unsupported_platform", 400);
        }

        ctx = { ...ctx, url: validation.url, platform: det, body };
      }

      return await handler(req, ctx);
    } catch (e) {
      if (e instanceof ExtractError) {
        return jsonError(e.code, e.httpStatus, e.message !== e.code ? { message: e.message } : undefined);
      }
      console.error("[api]", e);
      const msg = String((e as Error)?.message ?? "");
      if (
        msg.includes("Worker not configured") ||
        msg.includes("ECONNREFUSED") ||
        msg.includes("fetch failed")
      ) {
        return jsonError("degraded", 503, {
          message: "Extraction worker is not running.",
        });
      }
      return jsonError("internal", 500);
    }
  };
}
