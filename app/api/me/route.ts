import { withAuth } from "@/lib/http/with-auth";
import { jsonError } from "@/lib/http/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth(async (_req, ctx) => {
  if (!ctx.user) return jsonError("auth_required", 401);
  return Response.json({
    user: { id: ctx.user.id, email: ctx.user.email },
    plan: ctx.plan,
  });
});
