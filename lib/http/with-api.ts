import { NextRequest } from "next/server";
import { jsonError } from "@/lib/http/errors";
import { validateUrl, detect } from "@/lib/platform";
import { ExtractError } from "@/lib/extraction";
import { withAuth, type AuthContext } from "./with-auth";
import { withQuota, type QuotaContext } from "./with-quota";

export type ApiContext = QuotaContext;

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
  return withAuth(async (req: NextRequest, authCtx: AuthContext): Promise<Response> => {
    try {
      if (options.requireAuth && !authCtx.user) {
        return jsonError("auth_required", 401);
      }

      const quotaHandler = withQuota(async (_req, quotaCtx) => {
        let ctx: any = quotaCtx;

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
      });

      return await quotaHandler(req, authCtx);
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
  });
}
