import { NextRequest } from "next/server";
import { getSession, getUserPlan } from "@/lib/auth/session";
import { clientIp } from "@/lib/http/ip";
import type { Plan } from "@/lib/quota";

export type AuthContext = {
  ip: string;
  user: { id: string; email: string } | null;
  plan: Plan;
};

export function withAuth(
  handler: (req: NextRequest, ctx: AuthContext) => Promise<Response>,
) {
  return async (req: NextRequest): Promise<Response> => {
    const ip = clientIp(req);

    let user: { id: string; email: string } | null = null;
    let plan: Plan = "free";

    try {
      const session = await getSession();
      if (session?.user) {
        user = { id: session.user.id, email: session.user.email };
        plan = await getUserPlan(user.id);
      }
    } catch (e) {
      console.error("[auth] session error:", e);
    }

    return handler(req, { ip, user, plan });
  };
}
