import { NextRequest } from "next/server";
import { jsonError } from "@/lib/http/errors";
import { validateUrl, detect } from "@/lib/platform";
import { ExtractError } from "@/lib/extraction";
import { withAuth } from "./with-auth";
import { checkQuota } from "@/lib/quota";
import { type ApiContext, type UrlApiContext } from "./types";
export { type ApiContext, type UrlApiContext } from "./types";

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
  return withAuth(async (req: NextRequest, auth): Promise<Response> => {
    try {
      if (options.requireAuth && !auth.user) {
        return jsonError("auth_required", 401);
      }

      // Enforce quota
      const quota = await checkQuota(
        auth.user ? "user" : "anon",
        auth.user?.id ?? auth.ip,
        auth.ip,
        auth.plan
      );
      if (!quota.allowed) {
        return jsonError(quota.reason ?? "quota_exceeded", 429, { upgradeUrl: "/pricing" });
      }

      let ctx: any = { auth, quota };

      // Handle URL parsing if needed
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
        return jsonError(e.code, e.httpStatus);
      }
      console.error("[api]", e);
      if (
        [
          "Worker not configured",
          "ECONNREFUSED",
          "ENOTFOUND",
          "ETIMEDOUT",
          "ECONNRESET",
          "socket hang up",
          "fetch failed",
          "Cobalt",
        ].some((m) => String((e as Error)?.message ?? "").includes(m))
      ) {
        return jsonError("degraded", 503, {
          message: "Extraction worker is not reachable.",
        });
      }
      return jsonError("internal", 500);
    }
  });
}
