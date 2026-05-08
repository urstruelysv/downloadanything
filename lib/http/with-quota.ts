import { NextRequest } from "next/server";
import { checkAnon, checkUser } from "@/lib/quota";
import type { QuotaResult } from "@/lib/quota";
import { jsonError } from "@/lib/http/errors";
import type { AuthContext } from "./with-auth";

export type QuotaContext = AuthContext & { quota: QuotaResult };

export function withQuota(
  handler: (req: NextRequest, ctx: QuotaContext) => Promise<Response>,
) {
  return async (req: NextRequest, authCtx: AuthContext): Promise<Response> => {
    let quota: QuotaResult;
    if (authCtx.user) {
      quota = await checkUser(authCtx.user.id, authCtx.ip, authCtx.plan);
    } else {
      quota = await checkAnon(authCtx.ip);
    }

    if (!quota.allowed) {
      return jsonError(quota.reason ?? "quota_exceeded", 429, {
        upgradeUrl: "/pricing",
      });
    }

    return handler(req, { ...authCtx, quota });
  };
}
