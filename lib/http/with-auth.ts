import { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { getCurrentUser, getUserPlan } from "@/lib/auth/supabase-server";
import { clientIp } from "@/lib/http/ip";
import type { Plan } from "@/lib/quota";

export type AuthContext = {
  ip: string;
  user: User | null;
  plan: Plan;
};

export function withAuth(
  handler: (req: NextRequest, ctx: AuthContext) => Promise<Response>,
) {
  return async (req: NextRequest): Promise<Response> => {
    const ip = clientIp(req);

    let user: User | null = null;
    try {
      user = await getCurrentUser();
    } catch {
      // auth failure — treat as anonymous
    }

    let plan: Plan = "free";
    if (user) {
      plan = await getUserPlan(user.id);
    }

    return handler(req, { ip, user, plan });
  };
}
