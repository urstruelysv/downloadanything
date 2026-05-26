import { NextRequest } from "next/server";
import { z } from "zod";
import { createCheckoutUrl } from "@/lib/billing/lemonsqueezy";
import { getSession } from "@/lib/auth/session";
import { jsonError } from "@/lib/http/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({ plan: z.enum(["monthly", "yearly"]) });

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) return jsonError("auth_required", 401);
  
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return jsonError("invalid_request", 400);
  }
  try {
    const url = await createCheckoutUrl(session.user.id, parsed.plan);
    return Response.json({ url });
  } catch {
    return jsonError("internal", 500);
  }
}
