import { NextRequest } from "next/server";
import { z } from "zod";
import { extract, ExtractError } from "@/lib/extract/router";
import { assertSafeExtractTarget } from "@/lib/security/url-allowlist";
import { checkAnon, checkUser } from "@/lib/quota";
import { clientIp } from "@/lib/http/ip";
import { getCurrentUser, getUserPlan, supabaseService } from "@/lib/auth/supabase-server";
import { jsonError } from "@/lib/http/errors";
import { detect } from "@/lib/platform/detector";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({ url: z.string().min(1).max(2048) });

export async function POST(req: NextRequest) {
  try {
    let parsed;
    try {
      parsed = Body.parse(await req.json());
    } catch {
      return jsonError("invalid_url", 400);
    }
    const { url } = parsed;

    const safety = assertSafeExtractTarget(url);
    if (!safety.ok) {
      if (safety.reason === "unsupported_platform") {
        return jsonError("unsupported_platform", 400, {
          supported: ["youtube", "instagram", "tiktok", "twitter", "facebook", "reddit", "pinterest", "vimeo", "soundcloud", "generic"],
        });
      }
      return jsonError("invalid_url", 400);
    }

    const ip = clientIp(req);
    let user = null;
    try {
      user = await getCurrentUser();
    } catch (err) {
      console.error("[extract] getCurrentUser failed", err);
    }
    let plan: "free" | "subscribed" = "free";
    let quota;
    if (user) {
      plan = await getUserPlan(user.id);
      quota = await checkUser(user.id, ip, plan);
    } else {
      quota = await checkAnon(ip);
    }
    if (!quota.allowed) {
      return jsonError(quota.reason ?? "quota_exceeded", 429, { upgradeUrl: "/pricing" });
    }

    try {
      const result = await extract(url);
      const det = detect(url)!;
      void supabaseService()
        .from("downloads")
        .insert({
          user_id: user?.id ?? null,
          ip,
          url,
          platform: det.platform,
          format: null,
          bytes: null,
          status: "success",
          error: null,
        })
        .then(({ error }) => { if (error) console.error("[extract] download log failed", error); });
      return Response.json({ ...result, plan, remaining: quota.remaining });
    } catch (e) {
      if (e instanceof ExtractError) {
        return jsonError(e.code, e.httpStatus, e.message ? { message: e.message } : undefined);
      }
      throw e;
    }
  } catch (e: any) {
    console.error("[extract]", e?.message ?? e);
    const msg = String(e?.message ?? "");
    if (msg.includes("Worker not configured") || msg.includes("ECONNREFUSED") || msg.includes("fetch failed")) {
      return jsonError("degraded", 503, { message: "Extraction worker is not running. Start the worker container." });
    }
    return jsonError("internal", 500, { message: msg.slice(0, 200) });
  }
}
