import { getCurrentUser, getUserPlan } from "@/lib/auth/supabase-server";
import { jsonError } from "@/lib/http/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("auth_required", 401);
  const plan = await getUserPlan(user.id);
  return Response.json({
    user: { id: user.id, email: user.email },
    plan,
  });
}
