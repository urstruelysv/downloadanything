import { NextRequest } from "next/server";
import { z } from "zod";
import { createCheckoutUrl } from "@/lib/billing/lemonsqueezy";
import { getCurrentUser } from "@/lib/auth/supabase-server";
import { jsonError } from "@/lib/http/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({ plan: z.enum(["monthly", "yearly"]) });

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("auth_required", 401);
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return jsonError("invalid_request", 400);
  }
  try {
    const url = await createCheckoutUrl(user.id, parsed.plan);
    return Response.json({ url });
  } catch {
    return jsonError("internal", 500);
  }
}
